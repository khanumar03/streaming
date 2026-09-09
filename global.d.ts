import type pg from 'pg';

declare global {
  var __dbPool__: pg.Pool | undefined;
}

export {};