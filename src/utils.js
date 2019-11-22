const updateArr = (arr, newArr, isDescending = true) => {
  let resultArr = arr.slice();
  for (let n = 0; n < newArr.length; n++) {
    let prevArr = null;
    for (let i = 0; i < resultArr.length; i++) {
      let isMiddleElement = false;
      if (i !== 0) {
        prevArr = resultArr[i - 1];
        isMiddleElement = isDescending
            ? parseFloat(newArr[n][0]) < parseFloat(prevArr[0]) &&
            parseFloat(newArr[n][0]) > parseFloat(resultArr[i][0])
            : parseFloat(newArr[n][0]) > parseFloat(prevArr[0]) &&
            parseFloat(newArr[n][0]) < parseFloat(resultArr[i][0]);
      }
      const isTopElement = isDescending
          ? parseFloat(newArr[n][0]) > parseFloat(resultArr[0])
          : parseFloat(newArr[n][0]) < parseFloat(resultArr[0]);
      const isBottomElement = isDescending
          ? parseFloat(newArr[n][0]) <
          parseFloat(resultArr[resultArr.length - 1][0])
          : parseFloat(newArr[n][0]) >
          parseFloat(resultArr[resultArr.length - 1][0]);

      if (parseFloat(newArr[n][1]) === 0) {
        if (parseFloat(newArr[n][0]) === parseFloat(resultArr[i][0])) {
          resultArr.splice(i, 1);
          break;
        } else if (i === resultArr.length - 1) {
          break;
        }
      } else if (parseFloat(newArr[n][0]) === parseFloat(resultArr[i][0])) {
        resultArr[i] = newArr[n];
        break;
      } else if (isTopElement) {
        resultArr.splice(0, 0, newArr[n]);
        break;
      } else if (isBottomElement) {
        resultArr.push(newArr[n]);
        break;
      } else if (prevArr !== null && isMiddleElement) {
        resultArr.splice(i, 0, newArr[n]);
        break;
      }
    }
  }
  return resultArr.slice(0, 1000);
};

export const updateArrDesc = (arr, newArr) => updateArr(arr, newArr, true);
export const updateArrAsc= (arr, newArr) => updateArr(arr, newArr, false);

export const parseData = (data) => {
  let sum = 0;
  const result = data.map((item, id) => {
    sum += item[0] * item[1];
    return {
      key: id,
      price: item[0], //(+item[0]).toFixed(2),
      amount: item[1],
      total: (item[0] * item[1]).toFixed(8),
      sum: sum.toFixed(8)
    };
  });
  return result;
}
