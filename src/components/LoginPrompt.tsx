import React from 'react';
import { Link } from 'react-router-dom';

export function LoginPrompt() {
  return (
    <div className="bg-primary border border-fourth">
      <div className="bg-tertiary text-fifth px-2 py-0.5">
        <h2 className="text-sm font-semibold">
          How To Play
        </h2>
      </div>
      <div className="p-2">
        <p className="text-fifth font-light text-[0.625rem]">
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