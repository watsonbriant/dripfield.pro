import React from 'react';
import { Link } from 'react-router-dom';

export function LoginPrompt() {
  return (
    <div className="bg-primary border border-secondary rounded-lg p-3">
      <h2 className="text-xl items-center font-semibold bg-tertiary text-fifth inline-flex px-4 py-1 rounded-lg border border-secondary whitespace-nowrap mb-3">How To Play</h2>
      <div className="p-3 bg-tertiary/20 rounded border border-tertiary">
        <p className="text-fifth font-light text-sm">
          You need to be logged in to participate in Echo of a Show.{' '}
          <Link to="/login" className="font-medium hover:underline">
            Log in
          </Link>
          {' '}or{' '}
          <Link to="/signup" className="font-medium hover:underline">
            sign up
          </Link>
          {' '}to start playing!
        </p>
      </div>
    </div>
  );
}