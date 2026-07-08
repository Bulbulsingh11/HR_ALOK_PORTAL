/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { User } from '../types';
import LettersModule from './letters/LettersModule';

interface OfferLetterViewProps {
  currentUser: User | null;
}

export default function OfferLetterView({ currentUser }: OfferLetterViewProps) {
  return <LettersModule currentUser={currentUser} />;
}

