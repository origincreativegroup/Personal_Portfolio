import { component$ } from '@builder.io/qwik';
import { QwikCityProvider, RouterOutlet, ServiceWorkerRegister } from '@builder.io/qwik-city';
import '@builder.io/qwik-city/middleware/request-handler';
import './lib/tailwind.css';
import './styles/tokens.css';

export default component$(() => {
  return (
    <QwikCityProvider>
      <RouterOutlet />
      <ServiceWorkerRegister />
    </QwikCityProvider>
  );
});
