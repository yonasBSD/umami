import { z } from 'zod';
import { canViewWebsite } from 'lib/auth';
import { unauthorized, json } from 'lib/response';
import { parseRequest } from 'lib/request';
import { getInsights } from 'queries';

function convertFilters(filters: any[]) {
  return filters.reduce((obj, filter) => {
    obj[filter.name] = filter;

    return obj;
  }, {});
}

export async function POST(request: Request) {
  const schema = z.object({
    websiteId: z.string().uuid(),
    dateRange: z.object({
      startDate: z.date(),
      endDate: z.date(),
    }),
    fields: z
      .array(
        z.object({
          name: z.string(),
          type: z.string(),
          label: z.string(),
        }),
      )
      .min(1),
    filters: z.array(
      z.object({
        name: z.string(),
        type: z.string(),
        operator: z.string(),
        value: z.string(),
      }),
    ),
    groups: z.array(
      z.object({
        name: z.string(),
        type: z.string(),
      }),
    ),
  });

  const { auth, body, error } = await parseRequest(request, schema);

  if (error) {
    return error();
  }

  const {
    websiteId,
    dateRange: { startDate, endDate },
    fields,
    filters,
  } = body;

  if (!(await canViewWebsite(auth, websiteId))) {
    return unauthorized();
  }

  const data = await getInsights(websiteId, fields, {
    ...convertFilters(filters),
    startDate: new Date(startDate),
    endDate: new Date(endDate),
  });

  return json(data);
}
