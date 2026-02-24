export const getTodayKey = (input) => {
  const date = input instanceof Date ? input : new Date(input);

  if (isNaN(date.getTime())) {
    throw new Error("Invalid date passed to getTodayKey");
  }

  const DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  return DAYS[date.getDay()];
};
