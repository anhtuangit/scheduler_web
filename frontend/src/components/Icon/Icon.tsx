import { Icon as IconifyIcon } from '@iconify/react';

interface IconProps {
  icon: string;
  className?: string;
  size?: number | string;
  style?: React.CSSProperties;
}
const getIconString = (icon: string): string => {
  if (!icon) return 'mdi:help-circle-outline';
  
  if (icon.includes(':')) {
    return icon;
  }
  
  return `mdi:${icon}`;
};

const Icon = ({ icon, className = '', size = 24, style }: IconProps) => {
  const iconToUse = getIconString(icon);
  
  return (
    <IconifyIcon
      icon={iconToUse}
      className={className}
      width={size}
      height={size}
      style={style}
      onError={(e) => {
        // Fallback to default icon if icon fails to load
        if (iconToUse !== 'mdi:help-circle-outline') {
          const fallbackIcon = 'mdi:help-circle-outline';
          try {
            e.currentTarget.setAttribute('data-icon', fallbackIcon);
          } catch (err) {
            console.warn('Failed to set fallback icon:', err);
          }
        }
      }}
    />
  );
};

export default Icon;

