"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Switch, Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { InlineError } from "@/components/ui/states";
import { ApiError, fieldErrors } from "@/lib/api/client";
import { useApi, useApiWhen } from "@/lib/api/hooks";
import {
  createProperty, listAmenities, listAreas, listCategories, listDistricts, listDivisions,
  listThanas, toggleMarketplaceListing, updateProperty,
} from "@/lib/api/resources";
import type {
  ApiPropertyCreateRequest, ApiPropertyDetail, ApiPropertyUpdateRequest, ListingType,
} from "@/lib/api/types";
import { cn } from "@/lib/utils";

interface FormValues {
  title: string;
  description: string;
  categoryId: string;
  typeId: string;
  listingType: string;
  holdingNumber: string;
  rentAmount: string;
  depositAmount: string;
  areaSqft: string;
  bedrooms: string;
  bathrooms: string;
  balconies: string;
  rooms: string;
  divisionId: string;
  districtId: string;
  thanaId: string;
  areaId: string;
  street: string;
  city: string;
  state: string;
}

const blankValues: FormValues = {
  title: "",
  description: "",
  categoryId: "",
  typeId: "",
  listingType: "for_rent",
  holdingNumber: "",
  rentAmount: "",
  depositAmount: "",
  areaSqft: "",
  bedrooms: "2",
  bathrooms: "2",
  balconies: "1",
  rooms: "4",
  divisionId: "",
  districtId: "",
  thanaId: "",
  areaId: "",
  street: "",
  city: "",
  state: "",
};

const valuesFrom = (property: ApiPropertyDetail): FormValues => ({
  title: property.title,
  description: property.description,
  categoryId: String(property.propertyCategory.id),
  typeId: String(property.propertyType.id),
  listingType: property.listingType,
  holdingNumber: property.holding?.number ?? "",
  rentAmount: property.rentAmount,
  depositAmount: property.depositAmount ?? "",
  areaSqft: property.areaSqft ?? "",
  bedrooms: String(property.bedrooms),
  bathrooms: String(property.bathrooms),
  balconies: String(property.balconies),
  rooms: String(property.rooms),
  divisionId: property.division ? String(property.division.id) : "",
  districtId: property.district ? String(property.district.id) : "",
  thanaId: property.thana ? String(property.thana.id) : "",
  areaId: property.area ? String(property.area.id) : "",
  street: property.street,
  city: property.city,
  state: property.state,
});

/**
 * Serializer field names this form puts an input on. Anything the backend
 * rejects under a *different* key has nowhere to land, so it is folded into
 * the banner instead of being dropped.
 */
const renderedFields = new Set([
  "title", "description", "propertyCategory", "propertyType", "listingType", "holdingNumber",
  "rentAmount", "depositAmount", "areaSqft", "bedrooms", "bathrooms", "balconies", "rooms",
  "divisionId", "districtId", "thanaId", "areaId", "street", "city", "state", "amenities",
]);

const optionalInt = (value: string) => (value.trim() === "" ? undefined : Number(value));
const nullableDecimal = (value: string) => (value.trim() === "" ? null : value.trim());
/** An unpicked select is left out of the payload, so the backend answers with
 *  "This field is required." rather than `Invalid pk "0"`. */
const pk = (value: string) => (value === "" ? undefined : Number(value));

/**
 * The one property form, shared by the list page's "Add property" modal and
 * the detail page's "Edit". Passing a `property` switches it to PATCH against
 * that record; without one it POSTs a new property for the signed-in landlord.
 */
export function PropertyFormModal({
  open,
  onClose,
  onSaved,
  property,
}: {
  open: boolean;
  onClose: () => void;
  /** Called once the save lands, so the caller can refetch. */
  onSaved: () => void;
  property?: ApiPropertyDetail | null;
}) {
  if (!open) return null;
  // Keyed so every opening starts from the record as it stands, without an
  // effect syncing props into state.
  return (
    <PropertyForm
      key={property ? `edit-${property.id}-${property.updatedAt}` : "create"}
      onClose={onClose}
      onSaved={onSaved}
      property={property ?? null}
    />
  );
}

function PropertyForm({
  onClose,
  onSaved,
  property,
}: {
  onClose: () => void;
  onSaved: () => void;
  property: ApiPropertyDetail | null;
}) {
  const editing = property !== null;
  const [values, setValues] = useState<FormValues>(() =>
    property ? valuesFrom(property) : blankValues,
  );
  const [picked, setPicked] = useState<number[]>(
    () => property?.amenities.map((amenity) => amenity.id) ?? [],
  );
  const [listInMarketplace, setListInMarketplace] = useState(!editing);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  /** Set when the property itself saved but the follow-up listing call did not. */
  const [savedDespiteError, setSavedDespiteError] = useState(false);

  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const taxonomy = useApi(useCallback(() => listCategories(), []));
  const amenities = useApi(useCallback(() => listAmenities(), []));

  const divisions = useApi(useCallback(() => listDivisions(), []));
  const districts = useApiWhen(
    values.divisionId !== "",
    useCallback(() => listDistricts(Number(values.divisionId)), [values.divisionId]),
  );
  const thanas = useApiWhen(
    values.districtId !== "",
    useCallback(() => listThanas(Number(values.districtId)), [values.districtId]),
  );
  const areas = useApiWhen(
    values.thanaId !== "",
    useCallback(() => listAreas(Number(values.thanaId)), [values.thanaId]),
  );

  const categories = taxonomy.data ?? [];
  const types = categories.find((c) => String(c.id) === values.categoryId)?.types ?? [];

  const errors = error ? fieldErrors(error) : {};
  const unmatched = Object.entries(errors).filter(([field]) => !renderedFields.has(field));
  // The banner carries whatever has no input to sit against: a plain `error`
  // with no field map at all (the subscription property limit, a title clash),
  // plus any field the form does not render.
  const showBanner = error !== null && (Object.keys(errors).length === 0 || unmatched.length > 0);

  /** Partial on purpose: anything the landlord has not filled in is omitted so
   *  the backend's own required-field errors come back keyed to that field. */
  function buildPayload(): ApiPropertyUpdateRequest {
    const payload: ApiPropertyUpdateRequest = {
      title: values.title.trim(),
      description: values.description.trim(),
      propertyCategory: pk(values.categoryId),
      propertyType: pk(values.typeId),
      listingType: values.listingType as ListingType,
      divisionId: pk(values.divisionId),
      districtId: pk(values.districtId),
      thanaId: pk(values.thanaId),
      areaId: values.areaId === "" ? null : Number(values.areaId),
      street: values.street.trim(),
      city: values.city.trim(),
      state: values.state.trim(),
      rentAmount: values.rentAmount.trim(),
      depositAmount: nullableDecimal(values.depositAmount),
      areaSqft: nullableDecimal(values.areaSqft),
      bedrooms: optionalInt(values.bedrooms),
      bathrooms: optionalInt(values.bathrooms),
      balconies: optionalInt(values.balconies),
      rooms: optionalInt(values.rooms),
      amenities: picked,
    };
    // An empty `holdingNumber` is not "no holding": the backend would resolve a
    // holding literally numbered "", so leave the key out entirely instead.
    const holdingNumber = values.holdingNumber.trim();
    if (holdingNumber) payload.holdingNumber = holdingNumber;
    return payload;
  }

  async function submit() {
    setBusy(true);
    setError(null);
    // Tracked locally too: the catch below runs before the state update lands.
    let saved = false;
    try {
      if (property) {
        await updateProperty(property.id, buildPayload());
        onSaved();
        onClose();
        return;
      }

      const created = await createProperty(buildPayload() as ApiPropertyCreateRequest);
      saved = true;
      if (listInMarketplace && !created.isListedInMarketplace) {
        // The property exists from here on, so a failure past this point must
        // not re-run the whole submit — only the listing step went wrong.
        await toggleMarketplaceListing(created.id);
      }
      onSaved();
      onClose();
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught
          : new ApiError(0, caught instanceof Error ? caught.message : "Request failed"),
      );
      if (saved) {
        setSavedDespiteError(true);
        onSaved();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={editing ? "Edit property" : "Add a property"}
      description={
        editing
          ? "Changes are saved straight to the live listing."
          : "Creating a property counts against the landlord's subscription limit."
      }
      size="lg"
      footer={
        savedDespiteError ? (
          <Button variant="primary" onClick={onClose}>
            Close
          </Button>
        ) : (
          <>
            <Button onClick={onClose}>Cancel</Button>
            <Button variant="primary" disabled={busy} onClick={submit}>
              {busy ? "Saving…" : editing ? "Save changes" : "Create property"}
            </Button>
          </>
        )
      }
    >
      <div className="space-y-5">
        {savedDespiteError && error ? (
          <InlineError
            error={
              new ApiError(
                error.status,
                `The property was created, but listing it in the marketplace failed — ${error.message}`,
              )
            }
          />
        ) : showBanner ? (
          <InlineError
            error={
              unmatched.length > 0
                ? new ApiError(
                    error.status,
                    [
                      error.message,
                      ...unmatched.map(([field, message]) => `${field}: ${message}`),
                    ].join(" · "),
                  )
                : error
            }
          />
        ) : null}

        <Field
          label="Title"
          hint="Shown in the marketplace and all admin lists."
          error={errors.title}
        >
          <Input
            value={values.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="e.g. Gulshan 2 — 3 bed family apartment"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category" error={errors.propertyCategory}>
            <Select
              value={values.categoryId}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, categoryId: e.target.value, typeId: "" }))
              }
            >
              <option value="">Select a category…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Property type" error={errors.propertyType}>
            <Select
              value={values.typeId}
              disabled={values.categoryId === ""}
              onChange={(e) => set("typeId", e.target.value)}
            >
              <option value="">Select a type…</option>
              {types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Listing type" error={errors.listingType}>
            <Select
              value={values.listingType}
              onChange={(e) => set("listingType", e.target.value)}
            >
              <option value="for_rent">For rent</option>
              <option value="for_sale">For sale</option>
              <option value="for_book">For book</option>
            </Select>
          </Field>
          <Field
            label="Holding number"
            hint="Lazily created if it does not exist yet."
            error={errors.holdingNumber}
          >
            <Input
              value={values.holdingNumber}
              onChange={(e) => set("holdingNumber", e.target.value)}
              placeholder="H-102"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Monthly rent (৳)" error={errors.rentAmount}>
            <Input
              type="number"
              value={values.rentAmount}
              onChange={(e) => set("rentAmount", e.target.value)}
              placeholder="48000"
            />
          </Field>
          <Field label="Deposit (৳)" error={errors.depositAmount}>
            <Input
              type="number"
              value={values.depositAmount}
              onChange={(e) => set("depositAmount", e.target.value)}
              placeholder="96000"
            />
          </Field>
          <Field label="Area (sqft)" error={errors.areaSqft}>
            <Input
              type="number"
              value={values.areaSqft}
              onChange={(e) => set("areaSqft", e.target.value)}
              placeholder="1400"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <Field label="Bedrooms" error={errors.bedrooms}>
            <Input
              type="number"
              value={values.bedrooms}
              onChange={(e) => set("bedrooms", e.target.value)}
            />
          </Field>
          <Field label="Bathrooms" error={errors.bathrooms}>
            <Input
              type="number"
              value={values.bathrooms}
              onChange={(e) => set("bathrooms", e.target.value)}
            />
          </Field>
          <Field label="Balconies" error={errors.balconies}>
            <Input
              type="number"
              value={values.balconies}
              onChange={(e) => set("balconies", e.target.value)}
            />
          </Field>
          <Field label="Total rooms" error={errors.rooms}>
            <Input
              type="number"
              value={values.rooms}
              onChange={(e) => set("rooms", e.target.value)}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Division" error={errors.divisionId}>
            <Select
              value={values.divisionId}
              onChange={(e) =>
                setValues((prev) => ({
                  ...prev,
                  divisionId: e.target.value,
                  districtId: "",
                  thanaId: "",
                  areaId: "",
                }))
              }
            >
              <option value="">Select a division…</option>
              {(divisions.data ?? []).map((division) => (
                <option key={division.id} value={division.id}>
                  {division.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="District" error={errors.districtId}>
            <Select
              value={values.districtId}
              disabled={values.divisionId === ""}
              onChange={(e) =>
                setValues((prev) => ({
                  ...prev,
                  districtId: e.target.value,
                  thanaId: "",
                  areaId: "",
                }))
              }
            >
              <option value="">Select a district…</option>
              {(values.divisionId === "" ? [] : (districts.data ?? [])).map((district) => (
                <option key={district.id} value={district.id}>
                  {district.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Thana" error={errors.thanaId}>
            <Select
              value={values.thanaId}
              disabled={values.districtId === ""}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, thanaId: e.target.value, areaId: "" }))
              }
            >
              <option value="">Select a thana…</option>
              {(values.districtId === "" ? [] : (thanas.data ?? [])).map((thana) => (
                <option key={thana.id} value={thana.id}>
                  {thana.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Area" hint="Optional." error={errors.areaId}>
            <Select
              value={values.areaId}
              disabled={values.thanaId === ""}
              onChange={(e) => set("areaId", e.target.value)}
            >
              <option value="">No specific area</option>
              {(values.thanaId === "" ? [] : (areas.data ?? [])).map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Address" error={errors.street}>
          <Input
            value={values.street}
            onChange={(e) => set("street", e.target.value)}
            placeholder="House 9, Road 27"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="City" error={errors.city}>
            <Input
              value={values.city}
              onChange={(e) => set("city", e.target.value)}
              placeholder="Dhaka"
            />
          </Field>
          <Field label="State / division name" error={errors.state}>
            <Input
              value={values.state}
              onChange={(e) => set("state", e.target.value)}
              placeholder="Dhaka"
            />
          </Field>
        </div>

        <Field label="Description" error={errors.description}>
          <Textarea
            value={values.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Describe the space, utilities and nearby landmarks…"
          />
        </Field>

        <div>
          <p className="text-ink mb-2 text-[13px] font-medium">Amenities</p>
          <div className="flex flex-wrap gap-2">
            {(amenities.data ?? [])
              .filter((a) => a.isActive)
              .map((amenity) => {
                const on = picked.includes(amenity.id);
                return (
                  <button
                    key={amenity.id}
                    type="button"
                    onClick={() =>
                      setPicked((prev) =>
                        on ? prev.filter((id) => id !== amenity.id) : [...prev, amenity.id],
                      )
                    }
                    className={cn(
                      "focus-ring rounded-lg border px-2.5 py-1 text-[13px] transition-colors",
                      on
                        ? "bg-brand-soft border-brand/30 text-brand-ink"
                        : "border-line-strong text-ink-muted hover:bg-surface-hover",
                    )}
                  >
                    {amenity.name}
                  </button>
                );
              })}
            {amenities.loading && <span className="text-ink-subtle text-[13px]">Loading…</span>}
          </div>
          {errors.amenities && <p className="text-bad mt-1.5 text-xs">{errors.amenities}</p>}
        </div>

        {!editing && (
          <div className="border-line bg-surface-muted flex items-center justify-between rounded-xl border p-4">
            <div>
              <p className="text-ink text-[13px] font-medium">List in marketplace immediately</p>
              <p className="text-ink-subtle text-xs">
                Tenants can discover it and spend credits to unlock contact details.
              </p>
            </div>
            <Switch
              checked={listInMarketplace}
              onChange={setListInMarketplace}
              label="List in marketplace"
            />
          </div>
        )}
      </div>
    </Modal>
  );
}
