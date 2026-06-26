/**
 * Convierte una fecha del formato dd/MM/yyyy a ISO string
 * @param dateString Fecha en formato dd/MM/yyyy
 * @returns Fecha en formato ISO string o undefined si es inválida
 */
export const parseDateFromDDMMYYYY = (
  dateString: string,
): string | undefined => {
  if (!dateString || dateString.trim() === '') {
    return undefined;
  }

  // Validar formato dd/MM/yyyy
  const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const match = dateString.trim().match(dateRegex);

  if (!match) {
    return undefined;
  }

  const [, day, month, year] = match;
  const dayNum = parseInt(day, 10);
  const monthNum = parseInt(month, 10);
  const yearNum = parseInt(year, 10);

  // Validar rangos
  if (
    dayNum < 1 ||
    dayNum > 31 ||
    monthNum < 1 ||
    monthNum > 12 ||
    yearNum < 1900
  ) {
    return undefined;
  }

  // Crear fecha (mes - 1 porque Date usa 0-indexado)
  const date = new Date(yearNum, monthNum - 1, dayNum);

  // Verificar que la fecha es válida
  if (
    date.getDate() !== dayNum ||
    date.getMonth() !== monthNum - 1 ||
    date.getFullYear() !== yearNum
  ) {
    return undefined;
  }

  return date.toISOString();
};

/**
 * Convierte una fecha ISO o dd/MM/yyyy a formato dd/MM/yyyy
 * @param dateString Fecha en formato ISO o dd/MM/yyyy
 * @returns Fecha en formato dd/MM/yyyy o "Sin fecha" si es inválida
 */
export const formatDateToDDMMYYYY = (dateString?: string): string => {
  if (!dateString) {
    return 'Sin fecha';
  }

  try {
    // Si ya está en formato dd/MM/yyyy, devolverlo directamente
    if (dateString.includes('/') && !dateString.includes('T')) {
      // Validar que sea formato dd/MM/yyyy
      const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
      if (dateRegex.test(dateString)) {
        return dateString;
      }
    }

    // Si es formato ISO, convertir a dd/MM/yyyy
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Sin fecha';
    }

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  } catch (error) {
    return 'Sin fecha';
  }
};

/**
 * Valida si una fecha está en formato dd/MM/yyyy
 * @param dateString Fecha a validar
 * @returns true si es válida, false si no
 */
export const isValidDDMMYYYY = (dateString: string): boolean => {
  return parseDateFromDDMMYYYY(dateString) !== undefined;
};
