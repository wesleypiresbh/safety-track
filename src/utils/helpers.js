export const formatCurrency = (value) => {
  if (value === null || value === undefined) {
    return '';
  }
  // Convert to number if it's a string
  const numberValue = parseFloat(value);
  if (isNaN(numberValue)) {
    return '';
  }

  return numberValue.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};
