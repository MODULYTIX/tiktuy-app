// src/components/ecommerce/producto/ProductoCrearModal.tsx
import {
  useState,
  useEffect,
  useRef,
  useMemo,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { crearProducto } from "@/services/ecommerce/producto/producto.api";
import { fetchCategorias } from "@/services/ecommerce/categoria/categoria.api";
import { useAuth } from "@/auth/context";

import type { Producto } from "@/services/ecommerce/producto/producto.types";
import type { Categoria } from "@/services/ecommerce/categoria/categoria.types";

import { Inputx, InputxNumber, InputxTextarea } from "@/shared/common/Inputx";
import Tittlex from "@/shared/common/Tittlex";
import Buttonx from "@/shared/common/Buttonx";
import {
  SelectxCreatable,
  type CreatableOption,
} from "@/shared/common/SelectxCreatable";
import { Selectx } from "@/shared/common/Selectx";
import ImageUploadx from "@/shared/common/ImageUploadx";
import ImagePreviewModalx from "@/shared/common/ImagePreviewModalx";

// ========================
// Constantes
// ========================
const DEFAULT_CATEGORIES = [
  "Tecnología",
  "Hogar",
  "Moda",
  "Calzado",
  "Belleza",
  "Electrodomésticos",
  "Alimentos y bebidas",
  "Juguetes",
  "Deportes y fitness",
  "Libros/entretenimiento",
];

// Prefijo para IDs temporales de categorias por defecto que no estan en BD
const DEFAULT_PREFIX = "DEFAULT_";

// ========================
// Tipos
// ========================
type Props = {
  onClose: () => void;
  onCreated?: (producto: Producto) => void;
  /** Sede que se usará automáticamente (requerido) */
  almacenamientoId: number;
};

type EstadoId = "activo" | "inactivo" | "descontinuado";
type EstadoOption = { id: EstadoId; nombre: string };

const ESTADO_OPCIONES: EstadoOption[] = [
  { id: "activo", nombre: "Activo" },
  { id: "inactivo", nombre: "Inactivo" },
  { id: "descontinuado", nombre: "Descontinuado" },
];

type BasePayload = {
  almacenamiento_id: number;
  precio: number;
  stock: number;
  stock_minimo: number;
  peso: number;
  codigo_identificacion: string;
  nombre_producto: string;
  descripcion: string;
  estado: "activo" | "inactivo" | "descontinuado";
  fecha_registro: string;
};

type CreateProductoPayload =
  | ({
    categoria_id: number;
    categoria?: undefined;
  } & BasePayload)
  | ({
    categoria?: {
      nombre: string;
      descripcion?: string | null;
      es_global: true;
    };
    categoria_id?: undefined;
  } & BasePayload);

function generarCodigoConFecha(): string {
  const now = new Date();
  const hora = String(now.getHours()).padStart(2, "0");
  const minutos = String(now.getMinutes()).padStart(2, "0");
  const year = String(now.getFullYear()).slice(2);
  const meses = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
  const mesAbrev = meses[now.getMonth()];
  const charset = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ0123456789";
  const aleatorio = charset[Math.floor(Math.random() * charset.length)];
  return `${hora}${mesAbrev}${year}${aleatorio}${minutos}`;
}

type FormState = {
  codigo_identificacion: string;
  nombre_producto: string;
  descripcion: string;
  categoriaInput: string;
  categoriaSelectedId: string;

  almacenamiento_id: string;

  precio: string;
  stock: string;
  stock_minimo: string;
  peso: string;
  estado: EstadoId;
  fecha_registro: string;
};

const getInitialForm = (almacenamientoId: number): FormState => ({
  codigo_identificacion: generarCodigoConFecha(),
  nombre_producto: "",
  descripcion: "",
  categoriaInput: "",
  categoriaSelectedId: "",
  almacenamiento_id:
    !almacenamientoId || Number.isNaN(almacenamientoId)
      ? ""
      : String(almacenamientoId),
  precio: "",
  stock: "",
  stock_minimo: "",
  peso: "",
  estado: "activo",
  fecha_registro: new Date().toISOString(),
});

function canonical(s: string) {
  return s.normalize("NFKC").toLowerCase().trim().replace(/\s+/g, " ");
}
function parseNum(input: string, decimals = 2): number {
  const normalized = (input ?? "").toString().replace(",", ".").trim();
  const n = Number(normalized);
  return Number.isFinite(n) ? Number(n.toFixed(decimals)) : NaN;
}

export default function ProductoCrearModal({
  onClose,
  onCreated,
  almacenamientoId,
}: Props) {
  const { token } = useAuth();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(getInitialForm(almacenamientoId));
  const formRef = useRef<HTMLFormElement | null>(null);

  // Imagen
  const [file, setFile] = useState<File | null>(null);
  const [uploadPct, setUploadPct] = useState<number | undefined>(undefined);

  // Preview modal (lightbox)
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  // Cargar categorías (cuando se monta el contenido)
  useEffect(() => {
    if (!token) return;
    fetchCategorias(token).then(setCategorias).catch(console.error);
  }, [token]);

  // Reset cuando cambia sede (o cuando se vuelve a montar el modal)
  useEffect(() => {
    setForm(getInitialForm(almacenamientoId));
    setFile(null);
    setUploadPct(undefined);
    setPreviewOpen(false);
    setPreviewSrc(null);
  }, [almacenamientoId]);

  useEffect(() => {
    if (saving && file) {
      setUploadPct(10);
      const id = window.setInterval(() => {
        setUploadPct((p) => {
          const curr = typeof p === "number" ? p : 10;
          return Math.min(curr + 3, 90);
        });
      }, 120);
      return () => window.clearInterval(id);
    }
    setUploadPct(undefined);
  }, [saving, file]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleClose = () => {
    setForm(getInitialForm(almacenamientoId));
    setFile(null);
    setUploadPct(undefined);
    setPreviewOpen(false);
    setPreviewSrc(null);
    onClose();
  };

  const catOptions: CreatableOption[] = useMemo(() => {
    const result: CreatableOption[] = [];
    const usedNames = new Set<string>();

    // 1. Agregar defaults
    for (const defName of DEFAULT_CATEGORIES) {
      const dbMatch = categorias.find(c => canonical(c.nombre) === canonical(defName));
      if (dbMatch) {
        // Existe en DB -> Usar ID real
        result.push({ id: dbMatch.id, label: dbMatch.nombre });
        usedNames.add(canonical(dbMatch.nombre));
      } else {
        // No existe -> Usar ID fake pero mostrarlo
        // Usamos el nombre como label, y un ID prefijado para saber que es "nuevo"
        result.push({ id: `${DEFAULT_PREFIX}${defName}`, label: defName });
        usedNames.add(canonical(defName));
      }
    }

    // 2. Agregar el resto que esté en BD
    for (const cat of categorias) {
      if (!usedNames.has(canonical(cat.nombre))) {
        result.push({ id: cat.id, label: cat.nombre });
        usedNames.add(canonical(cat.nombre));
      }
    }

    // 3. Ordenar alfabéticamente
    return result.sort((a, b) => a.label.localeCompare(b.label, "es", { sensitivity: "base" }));
  }, [categorias]);

  function onCategoriaInputChange(v: string) {
    setForm((p) => {
      const match = catOptions.find((o) => canonical(o.label) === canonical(v));
      return {
        ...p,
        categoriaInput: v,
        categoriaSelectedId: match ? String(match.id) : "",
      };
    });
  }

  function onCategoriaSelect(opt: CreatableOption) {
    setForm((p) => ({
      ...p,
      categoriaInput: opt.label,
      categoriaSelectedId: String(opt.id),
    }));
  }

  function onCategoriaCreate(value: string) {
    setForm((p) => ({ ...p, categoriaInput: value, categoriaSelectedId: "" }));
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || saving) return;

    if (!form.nombre_producto.trim()) return;

    const precio = parseNum(form.precio, 2);
    const stock = parseNum(form.stock, 0);
    const stock_minimo = parseNum(form.stock_minimo, 0);
    const peso = parseNum(form.peso, 3);

    if ([precio, stock, stock_minimo, peso].some((n) => Number.isNaN(n))) return;

    const almacenamiento_id =
      !form.almacenamiento_id || form.almacenamiento_id === "0"
        ? undefined
        : Number(form.almacenamiento_id);

    let payload: CreateProductoPayload & { file?: File };

    // Validar si es una categoría existente real o una "Default" (nueva)
    const isRealCategory = form.categoriaSelectedId && !form.categoriaSelectedId.startsWith(DEFAULT_PREFIX);

    if (isRealCategory) {
      payload = {
        categoria_id: Number(form.categoriaSelectedId),
        ...(almacenamiento_id ? { almacenamiento_id } : {}),
        precio,
        stock,
        stock_minimo,
        peso,
        codigo_identificacion: form.codigo_identificacion.trim(),
        nombre_producto: form.nombre_producto.trim(),
        descripcion: form.descripcion.trim(),
        estado: form.estado,
        fecha_registro: new Date(form.fecha_registro).toISOString(),
      } as unknown as CreateProductoPayload;
    } else {
      if (!form.categoriaInput.trim()) return;
      payload = {
        categoria: {
          nombre: form.categoriaInput.trim(),
          descripcion: null,
          es_global: true as const,
        },
        ...(almacenamiento_id ? { almacenamiento_id } : {}),
        precio,
        stock,
        stock_minimo,
        peso,
        codigo_identificacion: form.codigo_identificacion.trim(),
        nombre_producto: form.nombre_producto.trim(),
        descripcion: form.descripcion.trim(),
        estado: form.estado,
        fecha_registro: new Date(form.fecha_registro).toISOString(),
      } as unknown as CreateProductoPayload;
    }

    if (file) (payload as any).file = file;

    setSaving(true);
    try {
      const cleanPayload = Object.fromEntries(
        Object.entries(payload).filter(
          ([, v]) => v !== undefined && v !== null && v !== "" && v !== "undefined"
        )
      );

      if (
        !("almacenamiento_id" in cleanPayload) ||
        isNaN(Number((cleanPayload as any).almacenamiento_id))
      ) {
        delete (cleanPayload as any).almacenamiento_id;
      }

      const producto = await crearProducto(cleanPayload as any, token);

      if (!form.categoriaSelectedId && (producto as any)?.categoria) {
        const nueva = (producto as any).categoria as Categoria;
        setCategorias((prev) => {
          const dup = prev.some((c) => canonical(c.nombre) === canonical(nueva.nombre));
          return dup ? prev : [...prev, nueva];
        });
      }

      onCreated?.(producto);
      setForm(getInitialForm(almacenamientoId));
      onClose();
    } catch (err) {
      console.error("Error al crear producto:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-[460px] overflow-x-hidden">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
        <Tittlex
          variant="modal"
          icon="vaadin:stock"
          title="REGISTRAR NUEVO PRODUCTO"
          description="Registra un nuevo producto en tu inventario especificando su información básica, ubicación en almacén y condiciones de stock."
        />

        <form
          id="crear-producto-form"
          ref={formRef}
          onSubmit={handleSubmit}
          className="flex flex-col gap-5 w-full"
        >
          <div className="flex flex-col gap-5">
            <Inputx
              name="codigo_identificacion"
              label="Código"
              value={form.codigo_identificacion}
              onChange={handleChange}
              disabled={saving}
              type="text"
            />

            <Inputx
              name="nombre_producto"
              label="Nombre del Producto"
              placeholder="Ejem. Zapatos de Cuero"
              value={form.nombre_producto}
              onChange={handleChange}
              required
              disabled={saving}
              type="text"
            />
          </div>

          <InputxTextarea
            name="descripcion"
            label="Descripción"
            value={form.descripcion}
            onChange={handleChange}
            disabled={saving}
            placeholder="Describe el producto…"
            autoResize
            minRows={3}
            maxRows={8}
          />

          <div className="flex gap-5">
            <div className="flex-1 min-w-0">
              <SelectxCreatable
                label="Categoría"
                labelVariant="left"
                placeholder="Escribe para buscar o crear…"
                inputValue={form.categoriaInput}
                selectedId={form.categoriaSelectedId}
                options={catOptions}
                disabled={saving}
                required
                onInputChange={onCategoriaInputChange}
                onSelectOption={onCategoriaSelect}
                onCreateFromInput={onCategoriaCreate}
              />
            </div>

            <div className="flex-1 min-w-0">
              <Selectx
                labelVariant="left"
                label="Estado"
                value={form.estado}
                onChange={(e) =>
                  setForm((p) => ({ ...p, estado: e.target.value as EstadoId }))
                }
                disabled={saving}
              >
                {ESTADO_OPCIONES.map((op) => (
                  <option key={op.id} value={op.id}>
                    {op.nombre}
                  </option>
                ))}
              </Selectx>
            </div>
          </div>

          <ImageUploadx
            label="Subir imagen"
            mode="create"
            value={file}
            onChange={(f) => setFile(f)}
            onView={(url) => {
              setPreviewSrc(url);
              requestAnimationFrame(() => setPreviewOpen(true));
            }}
            uploading={saving && !!file}
            progress={uploadPct}
            uploadText="Subiendo imagen…"
            minUploadMs={2000}
            maxSizeMB={5}
            size="md"
          />

          <div className="flex gap-5">
            <div className="flex-1 min-w-0">
              <InputxNumber
                label="Precio"
                name="precio"
                value={form.precio}
                onChange={handleChange}
                decimals={2}
                step={0.01}
                min={0}
                placeholder="0.00"
                disabled={saving}
              />
            </div>
            <div className="flex-1 min-w-0">
              <InputxNumber
                label="Cantidad"
                name="stock"
                value={form.stock}
                onChange={handleChange}
                decimals={0}
                step={1}
                min={0}
                placeholder="0"
                inputMode="numeric"
                disabled={saving}
              />
            </div>
          </div>

          <div className="flex gap-5">
            <div className="flex-1 min-w-0">
              <InputxNumber
                label="Stock Mínimo"
                name="stock_minimo"
                value={form.stock_minimo}
                onChange={handleChange}
                decimals={0}
                step={1}
                min={0}
                placeholder="0"
                inputMode="numeric"
                disabled={saving}
              />
            </div>
            <div className="flex-1 min-w-0">
              <InputxNumber
                label="Peso (kg)"
                name="peso"
                value={form.peso}
                onChange={handleChange}
                decimals={3}
                step={0.001}
                min={0}
                placeholder="0.000"
                disabled={saving}
              />
            </div>
          </div>
        </form>
      </div>

      {/* Footer fijo */}
      <div className="p-5 pt-3 border-t border-gray-200 bg-white">
        <div className="flex items-center gap-5 justify-start">
          <Buttonx
            variant="quartery"
            onClick={() => formRef.current?.requestSubmit()}
            disabled={saving}
            label={saving ? "Creando…" : "Crear nuevo"}
            className={`px-4 text-sm ${saving ? "[&_svg]:animate-spin" : ""}`}
            type="button"
          />
          <Buttonx
            variant="tertiary"
            onClick={handleClose}
            disabled={saving}
            label="Cancelar"
            icon=""
            type="button"
          />
        </div>
      </div>

      <ImagePreviewModalx
        open={previewOpen}
        src={previewSrc ?? ""}
        onClose={() => {
          setPreviewOpen(false);
          setPreviewSrc(null);
        }}
      />
    </div>
  );
}
