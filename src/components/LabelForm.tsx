import { useState } from "react";
import type { ChangeEvent, FocusEvent } from "react";
import { ILLUSTRATION_OPTIONS, type LabelData } from "../label/label.types";
import { cleanLabelName } from "../utils/cleanLabelName";
import { normalizeWeight } from "../utils/normalizeWeight";

interface LabelFormProps {
  data: LabelData;
  onChange: (data: LabelData) => void;
}
type TouchedFields = Partial<Record<"name" | "weight", boolean>>;

export function LabelForm({ data, onChange }: LabelFormProps) {
  const [touched, setTouched] = useState<TouchedFields>({});
  const nameError = touched.name && !cleanLabelName(data.name) ? "Informe o nome do alimento." : undefined;
  const weightError =
    touched.weight && !normalizeWeight(data.weight) ? "Informe uma quantidade válida (g, kg, ml ou L)." : undefined;
  const markTouched = (field: keyof TouchedFields) => {
    setTouched((current) => ({ ...current, [field]: true }));
  };
  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...data, name: event.target.value });
  };
  const handleNameBlur = (event: FocusEvent<HTMLInputElement>) => {
    markTouched("name");
    onChange({ ...data, name: cleanLabelName(event.target.value) });
  };
  const handleDescriptionChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...data, description: event.target.value });
  };
  const handleWeightChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...data, weight: event.target.value.replace(/[^\d.,a-zA-Z\s]/g, "") });
  };
  const handleWeightBlur = (event: FocusEvent<HTMLInputElement>) => {
    markTouched("weight");
    const normalized = normalizeWeight(event.target.value);
    if (normalized) onChange({ ...data, weight: normalized });
  };
  const handleIllustrationChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...data, illustration: event.target.value as LabelData["illustration"] });
  };
  return (
    <form className="label-form" noValidate>
      <div className="label-form__field">
        <label htmlFor="label-name">Nome do alimento <span aria-hidden="true">*</span></label>
        <input id="label-name" name="name" type="text" value={data.name}
          onChange={handleNameChange} onBlur={handleNameBlur} placeholder="Ex.: Frango"
          autoComplete="off" required aria-required="true" aria-invalid={Boolean(nameError)}
          aria-describedby={nameError ? "label-name-error" : undefined} />
        {nameError && <p className="label-form__error" id="label-name-error" role="alert">{nameError}</p>}
      </div>
      <div className="label-form__field">
        <label htmlFor="label-description">Descrição (opcional)</label>
        <input id="label-description" name="description" type="text" value={data.description}
          onChange={handleDescriptionChange} placeholder="Ex.: moído, cozido, desfiado" autoComplete="off" />
      </div>
      <div className="label-form__field">
        <label htmlFor="label-weight">Peso / quantidade <span aria-hidden="true">*</span></label>
        <div className="label-form__weight-input">
          <input id="label-weight" name="weight" type="text" inputMode="text" value={data.weight}
            onChange={handleWeightChange} onBlur={handleWeightBlur} placeholder="700g, 1,5kg, 500ml ou 2L"
            autoComplete="off" required aria-required="true" aria-invalid={Boolean(weightError)}
            aria-describedby="label-weight-hint label-weight-error" />
        </div>
        <p className="label-form__hint" id="label-weight-hint">
          Informe g, kg, ml ou L. Sem unidade, a quantidade será exibida em gramas.
        </p>
        {weightError && <p className="label-form__error" id="label-weight-error" role="alert">{weightError}</p>}
      </div>
      <div className="label-form__field">
        <label htmlFor="label-illustration">Ilustração</label>
        <select id="label-illustration" name="illustration" value={data.illustration}
          onChange={handleIllustrationChange}>
          {ILLUSTRATION_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <p className="label-form__hint">
          No modo Automática a ilustração é escolhida pelo alimento; você pode substituí-la.
        </p>
      </div>
    </form>
  );
}
