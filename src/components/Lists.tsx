import React from 'react';

export function Lists() {
  return (
    <div className="max-w-[936px] mx-auto">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-semibold bg-tertiary text-fifth inline-block px-4 py-1 rounded-lg border border-secondary">Lists</h1>
      </div>

      <div className="bg-primary border border-secondary rounded-lg p-3 mb-4">
        <h2 className="text-lg font-semibold bg-tertiary text-fifth inline-block px-3 py-0.5 rounded-lg border border-secondary mb-2">
          Songs
        </h2>
        <div className="text-fifth text-sm">
          Longest Known Performances By Song<br />
          Shortest Known Performances By Song<br />
          Most Common Segues Between Songs
        </div>
      </div>

      <div className="bg-primary border border-secondary rounded-lg p-3">
        <h2 className="text-lg font-semibold bg-tertiary text-fifth inline-block px-3 py-0.5 rounded-lg border border-secondary mb-2">
          Shows
        </h2>
        <div className="text-fifth text-sm">
          Longest Known Shows by Song Time<br />
          Shortest Known Shows by Song Time
        </div>
      </div>
    </div>
  );
}