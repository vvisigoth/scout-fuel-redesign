export const iso = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`

export const parseISO = (value: string) => {
  const [year, month, day] = value.split("-").map(Number)
  return new Date(year, month - 1, day)
}

export const formatDay = (value: string) =>
  parseISO(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
