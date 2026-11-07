/** "ana_garcia" -> "Ana Garcia". */
export const nombreVisible = (username: string): string =>
  username
    .split('_')
    .filter(Boolean)
    .map((parte) => {
      const [primera = '', ...resto] = Array.from(parte);
      return primera.toUpperCase() + resto.join('');
    })
    .join(' ');