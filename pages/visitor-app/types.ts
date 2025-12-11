import React from 'react';

export enum ViewState {
  HOME = 'HOME',
  LIVE = 'LIVE',
  ORDER = 'ORDER',
  EVENTS = 'EVENTS',
  PRAYER = 'PRAYER',
  PROFILE = 'PROFILE',
  TRANSLATION = 'TRANSLATION'
}

export interface NavItem {
  id: ViewState;
  label: string;
  icon: React.ReactNode;
}

export interface EventItem {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  image: string;
}

export interface PrayerRequest {
  id: string;
  author: string;
  content: string;
  likes: number;
  timeAgo: string;
}