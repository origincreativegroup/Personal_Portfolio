import { createElement, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

export type QueryKey = readonly unknown[];

type QueryStatus = 'idle' | 'loading' | 'success' | 'error';

type QueryListener = (state: QueryState) => void;

type QueryState = {
  data: unknown;
  error: unknown;
  status: QueryStatus;
  fetcher?: () => Promise<unknown>;
  listeners: Set<QueryListener>;
};

type QueryClientConfig = {
  defaultOptions?: {
    queries?: Record<string, unknown>;
    mutations?: Record<string, unknown>;
  };
};

const hashKey = (key: QueryKey): string => JSON.stringify(key);

export class QueryClient {
  private queries = new Map<string, QueryState>();

  // The config argument is kept for API compatibility with React Query.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(private readonly _config: QueryClientConfig = {}) {}

  private ensureQuery(key: QueryKey): QueryState {
    const hashed = hashKey(key);
    if (!this.queries.has(hashed)) {
      this.queries.set(hashed, {
        data: undefined,
        error: undefined,
        status: 'idle',
        listeners: new Set(),
      });
    }
    return this.queries.get(hashed) as QueryState;
  }

  private notify(state: QueryState) {
    state.listeners.forEach((listener) => listener(state));
  }

  getQueryData<T>(key: QueryKey): T | undefined {
    return this.ensureQuery(key).data as T | undefined;
  }

  setQueryData<T>(key: QueryKey, updater: T | ((prev: T | undefined) => T)): void {
    const state = this.ensureQuery(key);
    const previous = state.data as T | undefined;
    state.data = typeof updater === 'function' ? (updater as (value: T | undefined) => T)(previous) : updater;
    state.status = 'success';
    state.error = undefined;
    this.notify(state);
  }

  subscribe(key: QueryKey, listener: QueryListener): () => void {
    const state = this.ensureQuery(key);
    state.listeners.add(listener);
    return () => {
      state.listeners.delete(listener);
    };
  }

  async fetchQuery<T>(key: QueryKey, fetcher: () => Promise<T>): Promise<T> {
    const state = this.ensureQuery(key);
    state.status = 'loading';
    state.error = undefined;
    state.fetcher = fetcher;
    this.notify(state);

    try {
      const data = await fetcher();
      state.data = data;
      state.status = 'success';
      state.error = undefined;
      this.notify(state);
      return data;
    } catch (error) {
      state.error = error;
      state.status = 'error';
      this.notify(state);
      throw error;
    }
  }

  async invalidateQueries(opts: { queryKey: QueryKey }): Promise<void> {
    const state = this.queries.get(hashKey(opts.queryKey));
    if (state?.fetcher) {
      await this.fetchQuery(opts.queryKey, state.fetcher as () => Promise<unknown>);
    } else if (state) {
      state.status = 'idle';
      this.notify(state);
    }
  }

  async cancelQueries(_opts: { queryKey: QueryKey }): Promise<void> {
    // There's no ongoing fetch tracking yet, so this is a no-op kept for API compatibility.
  }

  removeQueries(opts: { queryKey: QueryKey }): void {
    const hashed = hashKey(opts.queryKey);
    this.queries.delete(hashed);
  }
}

const QueryClientContext = createContext<QueryClient | null>(null);

type QueryClientProviderProps = { client: QueryClient; children: ReactNode };

export const QueryClientProvider = ({ client, children }: QueryClientProviderProps) =>
  createElement(QueryClientContext.Provider, { value: client, children });

export const useQueryClient = (): QueryClient => {
  const client = useContext(QueryClientContext);
  if (!client) {
    throw new Error('useQueryClient must be used within a QueryClientProvider');
  }
  return client;
};

type UseQueryOptions<T> = {
  queryKey: QueryKey;
  queryFn: () => Promise<T>;
  enabled?: boolean;
};

type UseQueryResult<T> = {
  data: T | undefined;
  error: unknown;
  isLoading: boolean;
  isError: boolean;
  status: QueryStatus;
  refetch: () => Promise<void>;
};

export const useQuery = <T,>({ queryKey, queryFn, enabled = true }: UseQueryOptions<T>): UseQueryResult<T> => {
  const client = useQueryClient();
  const hashedKey = useMemo(() => hashKey(queryKey), [queryKey]);
  const queryFnRef = useRef(queryFn);
  const queryKeyRef = useRef<QueryKey>(queryKey);

  useEffect(() => {
    queryFnRef.current = queryFn;
  }, [queryFn]);

  useEffect(() => {
    queryKeyRef.current = queryKey;
  }, [hashedKey, queryKey]);

  const [state, setState] = useState<{ data: T | undefined; error: unknown; status: QueryStatus }>(() => {
    const data = client.getQueryData<T>(queryKey);
    return {
      data,
      error: undefined,
      status: data !== undefined ? 'success' : 'idle',
    };
  });

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let mounted = true;

    const listener: QueryListener = (queryState) => {
      if (!mounted) return;
      setState({
        data: queryState.data as T | undefined,
        error: queryState.error,
        status: queryState.status,
      });
    };

    const activeKey = queryKeyRef.current;

    const unsubscribe = client.subscribe(activeKey, listener);
    const existing = client.getQueryData<T>(activeKey);

    if (existing === undefined) {
      client.fetchQuery(activeKey, () => queryFnRef.current()).catch((error) => {
        if (!mounted) return;
        setState({ data: undefined, error, status: 'error' });
      });
    } else {
      setState({ data: existing, error: undefined, status: 'success' });
    }

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [client, enabled, hashedKey]);

  const refetch = useCallback(async () => {
    if (!enabled) return;
    await client.fetchQuery(queryKeyRef.current, () => queryFnRef.current());
  }, [client, enabled, hashedKey]);

  return {
    data: state.data,
    error: state.error,
    isLoading: state.status === 'loading' || (enabled && state.status === 'idle'),
    isError: state.status === 'error',
    status: state.status,
    refetch,
  };
};

type UseMutationOptions<TData, TVariables, TContext> = {
  mutationFn: (variables: TVariables) => Promise<TData>;
  onMutate?: (variables: TVariables) => Promise<TContext> | TContext;
  onSuccess?: (data: TData, variables: TVariables, context?: TContext) => Promise<void> | void;
  onError?: (error: unknown, variables: TVariables, context?: TContext) => Promise<void> | void;
};

type UseMutationResult<TData, TVariables, TContext> = {
  mutate: (variables: TVariables) => void;
  mutateAsync: (variables: TVariables) => Promise<TData>;
  data: TData | undefined;
  error: unknown;
  reset: () => void;
  isPending: boolean;
  status: 'idle' | 'pending' | 'success' | 'error';
};

export const useMutation = <TData, TVariables, TContext = unknown>({
  mutationFn,
  onMutate,
  onSuccess,
  onError,
}: UseMutationOptions<TData, TVariables, TContext>): UseMutationResult<TData, TVariables, TContext> => {
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [data, setData] = useState<TData | undefined>(undefined);
  const [error, setError] = useState<unknown>(undefined);

  const mutateAsync = useCallback(async (variables: TVariables): Promise<TData> => {
    setStatus('pending');
    setError(undefined);
    let context: TContext | undefined;

    try {
      context = await onMutate?.(variables);
    } catch (mutateError) {
      setStatus('error');
      setError(mutateError);
      throw mutateError;
    }

    try {
      const result = await mutationFn(variables);
      setData(result);
      setStatus('success');
      await onSuccess?.(result, variables, context);
      return result;
    } catch (mutationError) {
      setError(mutationError);
      setStatus('error');
      await onError?.(mutationError, variables, context);
      throw mutationError;
    }
  }, [mutationFn, onError, onMutate, onSuccess]);

  const mutate = useCallback((variables: TVariables) => {
    void mutateAsync(variables);
  }, [mutateAsync]);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(undefined);
    setData(undefined);
  }, []);

  return {
    mutate,
    mutateAsync,
    data,
    error,
    reset,
    isPending: status === 'pending',
    status,
  };
};

export const queryClient = new QueryClient();

export default queryClient;
