import { useState } from "react";
import type { ChangeEvent, FocusEvent } from "react";
import { ILLUSTRATION_OPTIONS, type LabelData } from "../label/label.types";
import { normalizeWeight } from "../utils/normalizeWeight";

interface LabelFormProps {
  data: LabelData;
  onChange: (data: LabelData) => void;
}

type TouchedFields = Partial<Record<"name" | "weight", boolean>>;

const WEIGHT_ALLOWED_CHARS = /[^\d.,]/g;

export function LabelForm({ data, onChange }: LabelFormProps) {
  const [touched, setTouched] = useState<TouchedFields>({});

  const nameError = touched.name && !data.name.trim() ? "Informe o nome do alimento." : undefined;
  const weightError =
    touched.weight && !normalizeWeight(data.weight) ? "Informe o peso da etiqueta." : undefined;

  const markTouched = (field: keyof TouchedFields) => {
    setTouched((current) => ({ ...current, [field]: true }));
  };

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...data, name: event.target.value });
  };

  const handleDescriptionChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...data, description: event.target.value });
  };

  const handleWeightChange = (event: ChangeEvent<HTMLInputElement>) => {
    const filtered = event.target.value.replace(WEIGHT_ALLOWED_CHARS, "");
    onChange({ ...data, weight: filtered });
  };

  const handleWeightBlur = (event: FocusEvent<HTMLInputElement>) => {
    markTouched("weight");
    onChange({ ...data, weight: normalizeWeight(event.target.value) });
  };

  const handleIllustrationChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...data, illustration: event.target.value as LabelData["illustration"] });
  };

  return (
    <form className="label-form" noValidate>
      <div className="label-form__field">
        <label htmlFor="label-name">
          Nome do alimento <span aria-hidden="true">*</span>
        </label>
        <input
          id="label-name"
          name="name"
          type="text"
          value={data.name}
          onChange={handleNameChange}
          onBlur={() => markTouched("name")}
          placeholder="Ex.: Legumes"
          autoComplete="off"
          required
          aria-required="true"
          aria-invalid={Boolean(nameError)}
          aria-describedby={nameError ? "label-name-error" : undefined}
        />
        {nameError && (
          <p className="label-form__error" id="label-name-error" role="alert">
            {nameError}
          </p>
        )}
      </div>

      <div className="label-form__field">
        <label htmlFor="label-description">Descrição (opcional)</label>
        <input
          id="label-description"
          name="description"
          type="text"
          value={data.description}
          onChange={handleDescriptionChange}
          placeholder="Ex.: moído, cozido, desfiado"
          autoComplete="off"
        />
      </div>

      <div className="label-form__field">
        <label htmlFor="label-weight">
          Peso (g) <span aria-hidden="true">*</span>
        </label>
        <div className="label-form__weight-input">
          <input
            id="label-weight"
            name="weight"
            type="text"
            inputMode="numeric"
            value={data.weight}
            onChange={handleWeightChange}
            onBlur={handleWeightBlur}
            placeholder="690"
            autoComplete="off"
            required
            aria-required="true"
            aria-invalid={Boolean(weightError)}
            aria-describedby="label-weight-hint label-weight-error"
          />
          <span aria-hidden="true" className="label-form__weight-suffix">
            g
          </span>
        </div>
        <p className="label-form__hint" id="label-weight-hint">
          Digite apenas o número. Na etiqueta aparecerá, por exemplo, 690g.
        </p>
        {weightError && (
          <p className="label-form__error" id="label-weight-error" role="alert">
            {weightError}
          </p>
        )}
      </div>

      <div className="label-form__field">
        <label htmlFor="label-illustration">Ilustração</label>
        <select
          id="label-illustration"
          name="illustration"
          value={data.illustration}
          onChange={handleIllustrationChange}
        >
          {ILLUSTRATION_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <p className="label-form__hint">
          No modo Automática a ilustração é escolhida a partir do nome do alimento. Você pode
          substituí-la a qualquer momento.
        </p>
      </div>
    </form>
  );
}
