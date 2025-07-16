function findMaxPoints(arr) {
  // Функция для нахождения максимального значения в ряду
  function getMaxInRow(row) {
    let max = 0;
    for (let i = 0; i < row.length; i++) {
      max = Math.max(max, row[i]);
    }
    return max;
  }

  // Проходим по массиву снизу вверх и обновляем значения в каждой клетке
  for (let i = arr.length - 2; i >= 0; i--) {
    for (let j = 0; j < arr[i].length; j++) {
      // Находим максимальное значение из трех возможных вариантов для следующего уровня
      let maxNextLevel = arr[i + 1][j];
      if (j > 0 && arr[i + 1][j - 1] > maxNextLevel) {
        maxNextLevel = arr[i + 1][j - 1];
      }
      if (j < arr[i].length - 1 && arr[i + 1][j + 1] > maxNextLevel) {
        maxNextLevel = arr[i + 1][j + 1];
      }

      // Прибавляем максимальное значение следующего уровня к текущему элементу
      arr[i][j] = arr[i][j] + maxNextLevel;
    }
  }

  // Находим максимальное значение в верхнем ряду
  return getMaxInRow(arr[0]);
}

// Пример использования
const input = [[5], [5, 6], [12, 1, 2], [90, 25, 120, 14]];
console.log(findMaxPoints(input)); // Ожидаемый результат: 115
