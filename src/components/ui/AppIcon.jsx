import React, { memo } from 'react';
import { FALLBACK_ICON_KEY, getIconComponent, ICON_STATE_CLASS } from '../../config/iconRegistry';

const AppIcon = ({
  name,
  size = 16,
  className = '',
  state = 'default',
  title = '',
  decorative = true,
}) => {
  const iconName = name || FALLBACK_ICON_KEY;
  const icon = getIconComponent(iconName);
  const stateClass = ICON_STATE_CLASS[state] || ICON_STATE_CLASS.default;
  const mergedClassName = ['app-icon', stateClass, className].filter(Boolean).join(' ');

  const accessibilityProps = decorative
    ? { 'aria-hidden': true }
    : { role: 'img', 'aria-label': title || iconName };

  if (typeof icon === 'string') {
    return (
      <img
        src={icon}
        className={mergedClassName}
        width={size}
        height={size}
        alt={decorative ? '' : (title || iconName)}
        style={{ objectFit: 'contain', imageRendering: 'pixelated' }}
        {...(decorative ? { 'aria-hidden': true } : { role: 'img' })}
      />
    );
  }

  const IconComponent = icon;
  return <IconComponent className={mergedClassName} size={size} title={title} {...accessibilityProps} />;
};

export default memo(AppIcon);
