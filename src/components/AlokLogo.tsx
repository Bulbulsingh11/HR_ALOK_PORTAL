/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ALOK_LOGO_BASE64 } from '../assets/base64Assets';

interface AlokLogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  theme?: 'dark' | 'light';
}

/**
 * Text-based corporate logo for ALOK Masterbatches HR Portal.
 * Clean, modern sans-serif typography with no abstract shapes.
 */
export default function AlokLogo({ 
  className = '', 
  showText = true, 
  size = 'md',
  theme = 'light'
}: AlokLogoProps) {
  
  // Font sizes depending on size prop for height scaling
  const heights = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-12'
  }[size];

  return (
    <div className={`flex items-center ${className} select-none`}>
      <img 
        src={ALOK_LOGO_BASE64} 
        alt="ALOK Logo" 
        className={`${heights} w-auto object-contain`} 
      />
    </div>
  );
}
