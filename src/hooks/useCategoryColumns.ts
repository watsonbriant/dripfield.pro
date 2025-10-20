import React from 'react';

type Category = {
  category: string;
  category_canonid: number;
  category_display_name: string;
  category_color1: string;
  category_color2: string;
  category_artwork: string;
};

export const useCategoryColumns = (categories: Category[], numColumns: number = 4) => {
  // Sort categories by canonid first
  const sortedCategories = [...categories].sort(
    (a, b) => a.category_canonid - b.category_canonid
  );
  
  if (numColumns === 1) {
    // For single column, just return all categories in one column
    return [sortedCategories];
  }
  
  const totalCategories = sortedCategories.length;
  const result: Category[][] = Array.from({ length: numColumns }, () => []);
  
  // For multi-column layouts, distribute vertically first, then horizontally
  // This distributes as:
  // 1, n+1, 2n+1, ...
  // 2, n+2, 2n+2, ...
  // etc.
  
  const rowsNeeded = Math.ceil(totalCategories / numColumns);
  
  // First create a virtual grid laid out in rows
  const grid: Category[][] = [];
  for (let i = 0; i < rowsNeeded; i++) {
    grid.push([]);
    for (let j = 0; j < numColumns; j++) {
      const index = i + j * rowsNeeded;
      if (index < totalCategories) {
        grid[i].push(sortedCategories[index]);
      }
    }
  }
  
  // Then transform the grid into columns
  for (let col = 0; col < numColumns; col++) {
    for (let row = 0; row < rowsNeeded; row++) {
      if (grid[row] && grid[row][col]) {
        result[col].push(grid[row][col]);
      }
    }
  }
  
  return result;
};
