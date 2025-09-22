import React, { ReactNode, useState } from 'react';
import { tokens } from '../shared/theme';
import { clsx } from '../shared/utils';

interface DevicePreviewProps {
  children: ReactNode;
  className?: string;
  defaultDevice?: 'desktop' | 'tablet' | 'mobile';
}

type Device = {
  name: string;
  width: string;
  height: string;
  icon: string;
};

const devices: Record<string, Device> = {
  desktop: {
    name: 'Desktop',
    width: '100%',
    height: '600px',
    icon: '🖥️',
  },
  tablet: {
    name: 'Tablet',
    width: '768px',
    height: '1024px',
    icon: '📱',
  },
  mobile: {
    name: 'Mobile',
    width: '375px',
    height: '667px',
    icon: '📱',
  },
};

export const DevicePreview: React.FC<DevicePreviewProps> = ({
  children,
  className,
  defaultDevice = 'desktop',
}) => {
  const [currentDevice, setCurrentDevice] = useState(defaultDevice);

  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing(4),
    fontFamily: tokens.font.family,
  };

  const deviceSwitcherStyles: React.CSSProperties = {
    display: 'flex',
    gap: tokens.spacing(2),
    alignItems: 'center',
    marginBottom: tokens.spacing(4),
  };

  const deviceButtonStyles = (isActive: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacing(2),
    padding: `${tokens.spacing(2)} ${tokens.spacing(3)}`,
    backgroundColor: isActive ? tokens.color.primary : 'transparent',
    color: isActive ? '#ffffff' : tokens.color.text,
    border: `1px solid ${isActive ? tokens.color.primary : tokens.color.border}`,
    borderRadius: tokens.radius.md,
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: 500,
    fontFamily: tokens.font.family,
    textTransform: 'lowercase',
    transition: 'all 0.2s ease-in-out',
  });

  const previewContainerStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: tokens.spacing(6),
    backgroundColor: '#f8f9fa',
    borderRadius: tokens.radius.xl,
    border: `1px solid ${tokens.color.border}`,
    minHeight: '400px',
  };

  const deviceFrameStyles: React.CSSProperties = {
    width: devices[currentDevice].width,
    maxWidth: '100%',
    height: devices[currentDevice].height,
    backgroundColor: tokens.color.bg,
    border: `1px solid ${tokens.color.border}`,
    borderRadius: tokens.radius.lg,
    overflow: 'hidden',
    position: 'relative',
    boxSizing: 'border-box',
  };

  const contentStyles: React.CSSProperties = {
    width: '100%',
    height: '100%',
    overflow: 'auto',
    padding: tokens.spacing(4),
  };

  const deviceInfoStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacing(2),
    color: tokens.color.textMuted,
    fontSize: '0.875rem',
    fontWeight: 500,
  };

  return (
    <div style={containerStyles} className={clsx('pf-device-preview', className)}>
      <div style={deviceSwitcherStyles}>
        {Object.entries(devices).map(([key, device]) => (
          <button
            key={key}
            style={deviceButtonStyles(currentDevice === key)}
            onClick={() => setCurrentDevice(key as 'desktop' | 'tablet' | 'mobile')}
            onMouseOver={(e) => {
              if (currentDevice !== key) {
                e.currentTarget.style.backgroundColor = '#f8f9fa';
              }
            }}
            onMouseOut={(e) => {
              if (currentDevice !== key) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            <span>{device.icon}</span>
            <span>{device.name}</span>
          </button>
        ))}

        <div style={{ marginLeft: 'auto' }}>
          <div style={deviceInfoStyles}>
            <span>
              {devices[currentDevice].width} × {devices[currentDevice].height}
            </span>
          </div>
        </div>
      </div>

      <div style={previewContainerStyles}>
        <div style={deviceFrameStyles}>
          <div style={contentStyles}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};