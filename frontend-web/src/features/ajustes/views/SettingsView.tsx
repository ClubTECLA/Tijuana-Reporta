import { FiLayers } from "react-icons/fi";
import ColSection from "@/components/layout/ColSection";
import RowSection from "@/components/layout/RowSection";
import { SideNav, SideNavItem } from "@/components/ui/SideNav";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { LuShieldCheck } from "react-icons/lu";
import SubsectionTitle from "@/components/ui/SubsectionTitle";
import Button from "@/components/ui/Button";
import { BiPlus } from "react-icons/bi";
import {
  Checkbox,
  SimpleStatistics,
  SimpleText,
  Table,
  TdButton,
  TCell,
  TRow,
} from "@/components/ui/Tables";
import { GoPencil } from "react-icons/go";
import type { ApiIncidente } from "@/types/api-types";
import CategoryForm from "@/features/categorias/components/CategoryForm";
import SubSection from "@/components/layout/SubSection";
import type { subsectionProps } from "@/types/utils-types";
import { listarIncidentes } from "@/features/categorias/incidentes.services";
import { useSysMessage } from "@/components/ui/SysMessageContext";
import { MdDeleteForever } from "react-icons/md";
import useModals from "@/panels/useModals";

// Cambiar a true cuando exista DELETE /incidentes/{id}
const CAN_DELETE_INCIDENTS = false;

function CategoriesSection({ debug }: subsectionProps) {
  const { showMessage } = useSysMessage();
  const { openModal } = useModals();
  const [categories, setCategories] = useState<ApiIncidente[]>([]);
  const [openForm, setOpenForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ApiIncidente | null>(
    null,
  );
  const [categoryReloadGeneration, setCategoryReloadGeneration] = useState(0);
  const categoryReloadGenerationRef = useRef(0);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const editorSessionRef = useRef(0);
  const [editorSession, setEditorSession] = useState(0);

  const requestCategoryReload = () => {
    const nextGeneration = categoryReloadGenerationRef.current + 1;
    categoryReloadGenerationRef.current = nextGeneration;
    setCategoryReloadGeneration(nextGeneration);
    setIsLoadingCategories(true);
  };

  const openCategoryForm = (category: ApiIncidente | null) => {
    const nextSession = editorSessionRef.current + 1;
    editorSessionRef.current = nextSession;
    setEditorSession(nextSession);
    setSelectedCategory(category);
    setOpenForm(true);
  };

  useEffect(() => {
    const generation = categoryReloadGeneration;
    let isCurrentRequest = true;

    const isLatestRequest = () =>
      isCurrentRequest && generation === categoryReloadGenerationRef.current;

    const fetchCategories = async () => {
      try {
        const res = await listarIncidentes({ incluir_inactivos: true });
        if (!isLatestRequest()) return;
        setCategories(res);
      } catch (err) {
        if (!isLatestRequest()) return;
        console.error(err);
        showMessage("Error al cargar las categorias", {
          color: "red",
          showTime: 3000,
          title: "Error",
        });
      } finally {
        if (isLatestRequest()) setIsLoadingCategories(false);
      }
    };
    void fetchCategories();

    return () => {
      isCurrentRequest = false;
    };
  }, [categoryReloadGeneration, showMessage]);

  const handleChangeIsActive = (e: ChangeEvent<HTMLInputElement>) => {
    setCategories((prev) =>
      prev.map((c) =>
        c.id.toString() === e.target.id
          ? { ...c, esta_activo: e.target.checked }
          : c,
      ),
    );

    //change esta_activo in db(send complete incident)
  };

  return (
    <ColSection
      arrangementSubsections="between"
      className="min-h-0 min-w-0 w-full gap-2"
      debug={debug}
    >
      <SubSection className="shrink-0 gap-3 p-2 flex-row justify-between w-full">
        <SubsectionTitle
          title="Categorias de incidentes"
          format="col"
          description={
            "Lo que el ciudadano puede elegir al reportar · " +
            categories.filter((c) => c.esta_activo).length +
            " activas, " +
            categories.filter((c) => !c.esta_activo).length +
            " inactiva"
          }
        />
        <Button
          title="Nueva categoria"
          variant="primary"
          format="both-fit"
          icon=<BiPlus />
          onClick={() => openCategoryForm(null)}
        />
      </SubSection>
      <RowSection className="min-h-0 min-w-0 w-full max-w-full flex-1 flex-col items-stretch gap-2 overflow-y-auto sm:flex-row sm:items-start sm:overflow-x-auto">
        <SubSection
          format={"nothing"}
          className="min-w-0 w-fit max-w-full overflow-x-hidden"
          aria-busy={isLoadingCategories}
        >
          <Table
            format="col"
            headers={[
              {
                title: "Categoria",
              },
              {
                title: "Etiquetas",
              },
              {
                title: "Reportes 30 D",
              },
              {
                title: "Activa",
              },
            ]}
          >
            {categories.map((c) => (
              <TRow key={c.id}>
                <SimpleText
                  icon={
                    <span
                      className={`inline-block size-7 rounded-full`}
                      style={{ background: c.color }}
                    />
                  }
                  text={c.nombre}
                />
                <SimpleStatistics statistics={c.tags?.length ?? 0} />
                <SimpleStatistics statistics="N/A" />
                <TCell className="flex flex-row items-center justify-end p-2">
                  <Checkbox
                    id={`${c.id}`}
                    name={c.nombre}
                    checked={c.esta_activo}
                    onChange={(e) => handleChangeIsActive(e)}
                  />
                  <TdButton
                    ariaLabel={`Editar ${c.nombre}`}
                    content={{
                      icon: <GoPencil />,
                    }}
                    onClick={() => {
                      openCategoryForm(c);
                    }}
                  />
                  {CAN_DELETE_INCIDENTS && (
                    <TdButton
                      ariaLabel={`Eliminar ${c.nombre}`}
                      content={{
                        icon: <MdDeleteForever />,
                      }}
                      onClick={() => {
                        openModal(
                          "Confirmar eliminación de incidente",
                          {
                            incident: { id: c.id, nombre: c.nombre },
                            onDeleted: (incidentId) => {
                              setCategories((prev) =>
                                prev.filter(
                                  (category) => category.id !== incidentId,
                                ),
                              );
                              requestCategoryReload();
                            },
                          },
                          { fullFocus: true },
                        );
                      }}
                    />
                  )}
                </TCell>
              </TRow>
            ))}
          </Table>
        </SubSection>
        {openForm && (
          <CategoryForm
            key={`${selectedCategory ? `edit-${selectedCategory.id}` : "create"}-${editorSession}`}
            format="col"
            category={selectedCategory}
            onClose={() => {
              if (editorSession !== editorSessionRef.current) return;
              const nextSession = editorSessionRef.current + 1;
              editorSessionRef.current = nextSession;
              setEditorSession(nextSession);
              setOpenForm(false);
            }}
            onSaveCategory={requestCategoryReload}
          />
        )}
      </RowSection>
    </ColSection>
  );
}

const SideNavItems = {
  Categorias: {
    icon: <FiLayers />,
    node: <CategoriesSection />,
  },
  "Roles y permisos": {
    icon: <LuShieldCheck />,
    node: null,
  },
};

type nodesName = keyof typeof SideNavItems;

export default function SettingView() {
  const [secSelected, setSecSelected] = useState<nodesName>("Categorias");
  const sideNavItems = Object.keys(SideNavItems) as nodesName[];

  return (
    <RowSection
      title="Ajustes"
      subtitle="Configuración general del sistema · solo administradores"
      debug={false}
      className="h-full min-h-0 min-w-0 gap-2 max-sm:flex-col font-ui"
    >
      <ColSection
        border={["right"]}
        className="max-sm:border-r-0 max-sm:border-b-2 h-full"
      >
        <SideNav format="col">
          {sideNavItems.map((item) => (
            <SideNavItem
              key={item}
              title={item}
              icon={SideNavItems[item].icon}
              isSelected={item === secSelected}
              onClick={() => setSecSelected(item)}
            />
          ))}
        </SideNav>
      </ColSection>
      {SideNavItems[secSelected].node}
    </RowSection>
  );
}
