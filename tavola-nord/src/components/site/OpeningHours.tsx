import { brand, displayTime } from "@/config/brand";
import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/routes";
import { isOpenNow, restaurantNow, weekdayOf } from "@/lib/booking";

/** Monday first, the way the week reads in Norway. */
const weekOrder = [1, 2, 3, 4, 5, 6, 0];

export function OpeningHours({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const now = restaurantNow();
  const today = weekdayOf(now.date);
  const open = isOpenNow(now);

  return (
    <div>
      <p className="mb-3 flex items-center gap-2 font-semibold">
        <span aria-hidden="true" className={`inline-block size-3 rounded-full ${open ? "bg-basil" : "bg-tomato"}`} />
        {open ? t.common.openNow : t.common.closedNow}
      </p>
      <table className="w-full max-w-sm border-collapse">
        <caption className="sr-only">{t.home.hoursHeading}</caption>
        <tbody>
          {weekOrder.map((day) => {
            const hours = brand.hours[day];
            return (
              <tr key={day} className={`border-t border-line ${day === today ? "font-bold" : ""}`}>
                <th scope="row" className="py-1.5 pr-6 text-left font-[inherit]">
                  {t.common.days[day]}
                </th>
                <td className="py-1.5 text-right">
                  {hours ? `${hours.open} ${locale === "nb" ? "til" : "to"} ${displayTime(hours.close)}` : t.common.closed}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
