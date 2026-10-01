'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePermissions } from '@/features/auth/hooks/use-permissions';
import { appConfig } from '@/shared/config/env';
import { Permission } from '@/shared/constants/domain';
import { Button } from '@/shared/ui/button';
import { Card, CardBody, CardHeader } from '@/shared/ui/card';
import { Spinner } from '@/shared/ui/feedback';
import { Field, Input, Select } from '@/shared/ui/form';
import { useOrganization, useUpdateOrganization } from '../api';

const WEEKDAYS = Array.from({ length: 7 }, (_, day) =>
  new Intl.DateTimeFormat(undefined, { weekday: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(2024, 0, 7 + day))),
);

function supportedTimezones(): string[] {
  const intl = Intl as typeof Intl & { supportedValuesOf?: (key: string) => string[] };
  return intl.supportedValuesOf?.('timeZone') ?? ['UTC'];
}

export function OrganizationSettings() {
  const { can } = usePermissions();
  const { data: organization, isLoading } = useOrganization();
  const update = useUpdateOrganization();
  const timezones = useMemo(supportedTimezones, []);
  const [values, setValues] = useState({ name: '', logoUrl: '', primaryColor: '', timezone: 'UTC', weekStartsOn: 1, workingHoursPerDay: 8 });
  const readOnly = !can(Permission.ORG_MANAGE);

  useEffect(() => {
    if (!organization) return;
    setValues({
      name: organization.name,
      logoUrl: organization.logoUrl ?? '',
      primaryColor: organization.primaryColor ?? appConfig.brandColor,
      timezone: organization.timezone,
      weekStartsOn: organization.weekStartsOn,
      workingHoursPerDay: organization.workingHoursPerDay,
    });
  }, [organization]);

  if (isLoading || !organization) return <Spinner />;

  const submit = () =>
    update.mutate({
      name: values.name.trim(),
      logoUrl: values.logoUrl.trim() || null,
      primaryColor: values.primaryColor || null,
      timezone: values.timezone,
      weekStartsOn: Number(values.weekStartsOn),
      workingHoursPerDay: Number(values.workingHoursPerDay),
    });

  return (
    <Card>
      <CardHeader title="Organization" description="Branding and working preferences used across reports and timesheets." />
      <CardBody>
        <fieldset disabled={readOnly} className="grid max-w-3xl gap-4 sm:grid-cols-2">
          <Field label="Organization name" className="sm:col-span-2">
            <Input value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} />
          </Field>
          <Field label="Logo URL" hint="Square image shown in the sidebar" className="sm:col-span-2">
            <Input type="url" placeholder="https://…" value={values.logoUrl} onChange={(e) => setValues({ ...values, logoUrl: e.target.value })} />
          </Field>
          <Field label="Brand color">
            <div className="flex gap-2">
              <Input type="color" className="w-14 p-1" value={values.primaryColor} onChange={(e) => setValues({ ...values, primaryColor: e.target.value })} />
              <Input value={values.primaryColor} onChange={(e) => setValues({ ...values, primaryColor: e.target.value })} />
            </div>
          </Field>
          <Field label="Timezone">
            <Select value={values.timezone} onChange={(e) => setValues({ ...values, timezone: e.target.value })}>
              {timezones.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Week starts on">
            <Select value={values.weekStartsOn} onChange={(e) => setValues({ ...values, weekStartsOn: Number(e.target.value) })}>
              {WEEKDAYS.map((day, index) => (
                <option key={day} value={index}>
                  {day}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Working hours per day" hint="Used for capacity and utilization">
            <Input type="number" min={1} max={24} step={0.5} value={values.workingHoursPerDay} onChange={(e) => setValues({ ...values, workingHoursPerDay: Number(e.target.value) })} />
          </Field>
          {!readOnly && (
            <div className="sm:col-span-2">
              <Button onClick={submit} loading={update.isPending}>
                Save changes
              </Button>
            </div>
          )}
        </fieldset>
      </CardBody>
    </Card>
  );
}
