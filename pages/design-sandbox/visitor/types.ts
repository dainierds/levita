import React from 'react';

export enum ViewState {
    HOME = 'HOME',
    LIVE = 'LIVE',
    ORDER = 'ORDER',
    EVENTS = 'EVENTS',
    PRAYER = 'PRAYER',
    PROFILE = 'PROFILE'
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
