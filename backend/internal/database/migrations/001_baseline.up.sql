-- Esquema completo de la base. Reemplaza a las migraciones 001 a 006 (siguen en
-- el historial de git) e incluye el cambio de fotos a multimedia y sin "Expirado".
-- Sale de un pg_dump --schema-only; al final van los datos semilla.

-- Name: estado; Type: TYPE; Schema: public; Owner: -
CREATE TYPE public.estado AS ENUM (
    'Pendiente',
    'Probable',
    'Verificado',
    'Resuelto',
    'Descartado'
);

-- Name: user_state; Type: TYPE; Schema: public; Owner: -
CREATE TYPE public.user_state AS ENUM (
    'Pendiente',
    'En revisión',
    'Verificado',
    'Suspendido'
);

-- Name: update_puntos_origen(); Type: FUNCTION; Schema: public; Owner: -
-- Ubicación (centroide) del reporte, promedio incremental O(1).
CREATE FUNCTION public.update_puntos_origen() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO puntos_origen (reporte_id, latitude, longitude, sample_count, updated_at)
    VALUES (NEW.reporte_id, NEW.latitude, NEW.longitude, 1, now())
    ON CONFLICT (reporte_id) DO UPDATE SET
        latitude = (puntos_origen.latitude * puntos_origen.sample_count + NEW.latitude)
                   / (puntos_origen.sample_count + 1),
        longitude = (puntos_origen.longitude * puntos_origen.sample_count + NEW.longitude)
                    / (puntos_origen.sample_count + 1),
        sample_count = puntos_origen.sample_count + 1,
        updated_at = now();

    RETURN NULL;
END;
$$;

-- Name: update_tag_counts(); Type: FUNCTION; Schema: public; Owner: -
-- Conteo de tags + score ponderado por reporte.
CREATE FUNCTION public.update_tag_counts() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_reporte_id UUID;
    v_tag_id INTEGER;
    v_peso INTEGER;
    v_delta INTEGER;
BEGIN
    IF TG_OP = 'INSERT' THEN
        v_reporte_id := NEW.reporte_id;
        v_tag_id := NEW.tag_id;
        v_delta := 1;
    ELSIF TG_OP = 'DELETE' THEN
        v_reporte_id := OLD.reporte_id;
        v_tag_id := OLD.tag_id;
        v_delta := -1;
    END IF;

    -- Actualiza (o crea) el conteo del tag en ese reporte
    INSERT INTO reporte_tag_counts (reporte_id, tag_id, count)
    VALUES (v_reporte_id, v_tag_id, GREATEST(v_delta, 0))
    ON CONFLICT (reporte_id, tag_id)
    DO UPDATE SET count = reporte_tag_counts.count + v_delta;

    -- Limpieza: si el conteo llega a 0, borra la fila
    DELETE FROM reporte_tag_counts
    WHERE reporte_id = v_reporte_id
      AND tag_id = v_tag_id
      AND count <= 0;

    -- Obtiene el peso del tag para actualizar el score total del reporte
    SELECT peso INTO v_peso FROM tags WHERE id = v_tag_id;

    INSERT INTO reportes_scores (reporte_id, total_score)
    VALUES (v_reporte_id, GREATEST(v_peso * v_delta, 0))
    ON CONFLICT (reporte_id)
    DO UPDATE SET total_score = reportes_scores.total_score + (v_peso * v_delta);

    RETURN NULL;
END;
$$;

-- Name: acciones; Type: TABLE; Schema: public; Owner: -
-- Catálogo de acciones que se pueden realizar
CREATE TABLE public.acciones (
    id integer NOT NULL,
    nombre character varying(50) NOT NULL
);

-- Name: acciones_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.acciones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- Name: acciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.acciones_id_seq OWNED BY public.acciones.id;

-- Name: auth_providers; Type: TABLE; Schema: public; Owner: -
-- Indica si un usuario inició sesión con cuenta local o con Google (guarda el token/id del provider)
CREATE TABLE public.auth_providers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    provider character varying(20) NOT NULL,
    provider_id character varying(255),
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Name: comentarios; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.comentarios (
    id integer NOT NULL,
    reporte_id uuid NOT NULL,
    user_id uuid NOT NULL,
    comentario text NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Name: comentarios_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.comentarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- Name: comentarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.comentarios_id_seq OWNED BY public.comentarios.id;

-- Name: multimedia; Type: TABLE; Schema: public; Owner: -
-- Foto o video que un usuario sube en un reporte. El UNIQUE limita a un archivo por usuario por reporte.
CREATE TABLE public.multimedia (
    id integer NOT NULL,
    reporte_id uuid NOT NULL,
    path text NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Name: fotos_reportes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.fotos_reportes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- Name: fotos_reportes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.fotos_reportes_id_seq OWNED BY public.multimedia.id;

-- Name: historial; Type: TABLE; Schema: public; Owner: -
-- Historial de acciones realizadas por los usuarios (mas que nada dirigida a usuarios con roles superiores a ciudadano)
CREATE TABLE public.historial (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    accion_id integer NOT NULL,
    nombre_target text,
    descripcion text,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Name: incidente_tags; Type: TABLE; Schema: public; Owner: -
-- Registro de qué tags ha añadido cada usuario a cada reporte.
-- El UNIQUE evita que un mismo usuario añada el mismo tag dos veces.
CREATE TABLE public.incidente_tags (
    id integer NOT NULL,
    reporte_id uuid NOT NULL,
    tag_id integer NOT NULL,
    added_by uuid NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Name: incidente_tags_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.incidente_tags_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- Name: incidente_tags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.incidente_tags_id_seq OWNED BY public.incidente_tags.id;

-- Name: incidentes; Type: TABLE; Schema: public; Owner: -
-- Catálogo que contiene cada tipo de incidente.
CREATE TABLE public.incidentes (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    tiempo_limite smallint,
    radio numeric,
    esta_activo boolean DEFAULT true NOT NULL,
    color character varying(7) DEFAULT '#757575'::character varying NOT NULL,
    CONSTRAINT incidentes_color_hex_check CHECK (((color)::text ~ '^#[0-9A-Fa-f]{6}$'::text))
);

-- Name: incidentes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.incidentes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- Name: incidentes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.incidentes_id_seq OWNED BY public.incidentes.id;

-- Name: location; Type: TABLE; Schema: public; Owner: -
-- Cada localización que ha reportado un usuario para un reporte (para calcular el centroide).
CREATE TABLE public.location (
    id integer NOT NULL,
    reporte_id uuid NOT NULL,
    latitude numeric NOT NULL,
    longitude numeric NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Name: location_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.location_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- Name: location_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.location_id_seq OWNED BY public.location.id;

-- Name: logs; Type: TABLE; Schema: public; Owner: -
-- Log histórico para análisis de zonas propensas a incidentes.
CREATE TABLE public.logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    incidente_id integer NOT NULL,
    longitude numeric NOT NULL,
    latitude numeric NOT NULL,
    peso integer NOT NULL,
    started_at timestamptz NOT NULL,
    finished_at timestamptz DEFAULT now() NOT NULL
);

-- Name: notificaciones; Type: TABLE; Schema: public; Owner: -
-- Tabla que contiene las notificaciones de los usuarios
CREATE TABLE public.notificaciones (
    id integer NOT NULL,
    user_id uuid NOT NULL,
    notificacion text
);

-- Name: notificaciones_counts; Type: TABLE; Schema: public; Owner: -
-- Conteo de notifiaciones no vistas por el usuario
CREATE TABLE public.notificaciones_counts (
    user_id uuid NOT NULL,
    count integer DEFAULT 0 NOT NULL
);

-- Name: notificaciones_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.notificaciones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- Name: notificaciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.notificaciones_id_seq OWNED BY public.notificaciones.id;

-- Name: puntos_origen; Type: TABLE; Schema: public; Owner: -
-- Ubicación derivada (centroide) de cada reporte, mantenida por trigger vía incremental average.
-- Al vivir separada de "reporte", los updates frecuentes
-- de ubicación no reescriben la fila completa de reporte ni sus índices.
CREATE TABLE public.puntos_origen (
    reporte_id uuid NOT NULL,
    latitude numeric NOT NULL,
    longitude numeric NOT NULL,
    sample_count integer DEFAULT 0 NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.refresh_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    token_hash text NOT NULL,
    expires_at timestamptz NOT NULL,
    revoked_at timestamptz,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Name: reporte; Type: TABLE; Schema: public; Owner: -
-- Tabla que mantiene todos los reportes creados.
-- Nota: ya no incluye "peso" (vive solo en reportes_scores) ni "punto_origen"
CREATE TABLE public.reporte (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    incidente_id integer NOT NULL,
    avistamientos integer DEFAULT 0 NOT NULL,
    es_historico boolean DEFAULT false NOT NULL,
    es_oficial boolean DEFAULT false NOT NULL,
    estado_actual public.estado DEFAULT 'Pendiente'::public.estado NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- Name: reporte_tag_counts; Type: TABLE; Schema: public; Owner: -
-- Conteo de cuántas veces se ha confirmado cada tag en cada reporte. Mantenida por trigger.
CREATE TABLE public.reporte_tag_counts (
    reporte_id uuid NOT NULL,
    tag_id integer NOT NULL,
    count integer DEFAULT 0 NOT NULL
);

-- Name: reportes_scores; Type: TABLE; Schema: public; Owner: -
-- Score total ponderado de cada reporte (única fuente de verdad del "peso"). Mantenida por trigger.
CREATE TABLE public.reportes_scores (
    reporte_id uuid NOT NULL,
    total_score integer DEFAULT 0 NOT NULL
);

-- Name: roles; Type: TABLE; Schema: public; Owner: -
-- Catálogo de roles del sistema.
CREATE TABLE public.roles (
    id integer NOT NULL,
    nombre character varying(255) NOT NULL
);

-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;

-- Name: tags; Type: TABLE; Schema: public; Owner: -
-- Catálogo de cada tipo de tag y a qué tipo de incidente pertenece.
-- El UNIQUE evita repetir el mismo tag dentro del mismo tipo de incidente.
CREATE TABLE public.tags (
    id integer NOT NULL,
    incidente_id integer NOT NULL,
    nombre character varying(50) NOT NULL,
    peso integer DEFAULT 1 NOT NULL
);

-- Name: tags_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.tags_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- Name: tags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.tags_id_seq OWNED BY public.tags.id;

-- Name: users; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255),
    phone character varying(15),
    username character varying(100) NOT NULL,
    rol_id integer NOT NULL,
    password_hash text,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    state public.user_state
);

-- Name: users_reports; Type: TABLE; Schema: public; Owner: -
-- Historial de reportes que ha creado/reportado cada usuario.
CREATE TABLE public.users_reports (
    id integer NOT NULL,
    user_id uuid NOT NULL,
    reporte_id uuid NOT NULL
);

-- Name: users_reports_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.users_reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- Name: users_reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.users_reports_id_seq OWNED BY public.users_reports.id;

-- Name: acciones id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.acciones ALTER COLUMN id SET DEFAULT nextval('public.acciones_id_seq'::regclass);

-- Name: comentarios id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.comentarios ALTER COLUMN id SET DEFAULT nextval('public.comentarios_id_seq'::regclass);

-- Name: incidente_tags id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.incidente_tags ALTER COLUMN id SET DEFAULT nextval('public.incidente_tags_id_seq'::regclass);

-- Name: incidentes id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.incidentes ALTER COLUMN id SET DEFAULT nextval('public.incidentes_id_seq'::regclass);

-- Name: location id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.location ALTER COLUMN id SET DEFAULT nextval('public.location_id_seq'::regclass);

-- Name: multimedia id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.multimedia ALTER COLUMN id SET DEFAULT nextval('public.fotos_reportes_id_seq'::regclass);

-- Name: notificaciones id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.notificaciones ALTER COLUMN id SET DEFAULT nextval('public.notificaciones_id_seq'::regclass);

-- Name: roles id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);

-- Name: tags id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.tags ALTER COLUMN id SET DEFAULT nextval('public.tags_id_seq'::regclass);

-- Name: users_reports id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.users_reports ALTER COLUMN id SET DEFAULT nextval('public.users_reports_id_seq'::regclass);

-- Name: acciones acciones_nombre_key; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.acciones
    ADD CONSTRAINT acciones_nombre_key UNIQUE (nombre);

-- Name: acciones acciones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.acciones
    ADD CONSTRAINT acciones_pkey PRIMARY KEY (id);

-- Name: auth_providers auth_providers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.auth_providers
    ADD CONSTRAINT auth_providers_pkey PRIMARY KEY (id);

-- Name: auth_providers auth_providers_user_id_provider_key; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.auth_providers
    ADD CONSTRAINT auth_providers_user_id_provider_key UNIQUE (user_id, provider);

-- Name: comentarios comentarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.comentarios
    ADD CONSTRAINT comentarios_pkey PRIMARY KEY (id);

-- Name: multimedia fotos_reportes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.multimedia
    ADD CONSTRAINT fotos_reportes_pkey PRIMARY KEY (id);

-- Name: multimedia fotos_reportes_reporte_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.multimedia
    ADD CONSTRAINT fotos_reportes_reporte_id_user_id_key UNIQUE (reporte_id, user_id);

-- Name: historial historial_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.historial
    ADD CONSTRAINT historial_pkey PRIMARY KEY (id);

-- Name: incidente_tags incidente_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.incidente_tags
    ADD CONSTRAINT incidente_tags_pkey PRIMARY KEY (id);

-- Name: incidente_tags incidente_tags_reporte_id_tag_id_added_by_key; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.incidente_tags
    ADD CONSTRAINT incidente_tags_reporte_id_tag_id_added_by_key UNIQUE (reporte_id, tag_id, added_by);

-- Name: incidentes incidentes_nombre_key; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.incidentes
    ADD CONSTRAINT incidentes_nombre_key UNIQUE (nombre);

-- Name: incidentes incidentes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.incidentes
    ADD CONSTRAINT incidentes_pkey PRIMARY KEY (id);

-- Name: location location_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.location
    ADD CONSTRAINT location_pkey PRIMARY KEY (id);

-- Name: logs logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.logs
    ADD CONSTRAINT logs_pkey PRIMARY KEY (id);

-- Name: notificaciones_counts notificaciones_counts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.notificaciones_counts
    ADD CONSTRAINT notificaciones_counts_pkey PRIMARY KEY (user_id);

-- Name: notificaciones notificaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.notificaciones
    ADD CONSTRAINT notificaciones_pkey PRIMARY KEY (id);

-- Name: puntos_origen puntos_origen_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.puntos_origen
    ADD CONSTRAINT puntos_origen_pkey PRIMARY KEY (reporte_id);

-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);

-- Name: refresh_tokens refresh_tokens_token_hash_key; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_hash_key UNIQUE (token_hash);

-- Name: reporte reporte_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.reporte
    ADD CONSTRAINT reporte_pkey PRIMARY KEY (id);

-- Name: reporte_tag_counts reporte_tag_counts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.reporte_tag_counts
    ADD CONSTRAINT reporte_tag_counts_pkey PRIMARY KEY (reporte_id, tag_id);

-- Name: reportes_scores reportes_scores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.reportes_scores
    ADD CONSTRAINT reportes_scores_pkey PRIMARY KEY (reporte_id);

-- Name: roles roles_nombre_key; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_nombre_key UNIQUE (nombre);

-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);

-- Name: tags tags_incidente_id_nombre_key; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_incidente_id_nombre_key UNIQUE (incidente_id, nombre);

-- Name: tags tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (id);

-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);

-- Name: users users_phone_key; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);

-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);

-- Name: users_reports users_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.users_reports
    ADD CONSTRAINT users_reports_pkey PRIMARY KEY (id);

-- Name: users_reports users_reports_user_id_reporte_id_key; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.users_reports
    ADD CONSTRAINT users_reports_user_id_reporte_id_key UNIQUE (user_id, reporte_id);

-- Name: idx_comentarios_reporte_id; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_comentarios_reporte_id ON public.comentarios USING btree (reporte_id);

-- Name: idx_incidente_tags_reporte_id; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_incidente_tags_reporte_id ON public.incidente_tags USING btree (reporte_id);

-- Name: idx_location_reporte_id; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_location_reporte_id ON public.location USING btree (reporte_id);

-- Name: idx_refresh_tokens_user_id; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_refresh_tokens_user_id ON public.refresh_tokens USING btree (user_id);

-- Name: idx_reporte_estado_actual; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_reporte_estado_actual ON public.reporte USING btree (estado_actual);

-- Name: idx_reporte_incidente_id; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_reporte_incidente_id ON public.reporte USING btree (incidente_id);

-- Name: idx_tags_incidente_id; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_tags_incidente_id ON public.tags USING btree (incidente_id);

-- Name: location trg_update_puntos_origen; Type: TRIGGER; Schema: public; Owner: -
CREATE TRIGGER trg_update_puntos_origen AFTER INSERT ON public.location FOR EACH ROW EXECUTE FUNCTION public.update_puntos_origen();

-- Name: incidente_tags trg_update_tag_counts; Type: TRIGGER; Schema: public; Owner: -
CREATE TRIGGER trg_update_tag_counts AFTER INSERT OR DELETE ON public.incidente_tags FOR EACH ROW EXECUTE FUNCTION public.update_tag_counts();

-- Name: auth_providers auth_providers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.auth_providers
    ADD CONSTRAINT auth_providers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Name: comentarios comentarios_reporte_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.comentarios
    ADD CONSTRAINT comentarios_reporte_id_fkey FOREIGN KEY (reporte_id) REFERENCES public.reporte(id) ON DELETE CASCADE;

-- Name: comentarios comentarios_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.comentarios
    ADD CONSTRAINT comentarios_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);

-- Name: multimedia fotos_reportes_reporte_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.multimedia
    ADD CONSTRAINT fotos_reportes_reporte_id_fkey FOREIGN KEY (reporte_id) REFERENCES public.reporte(id) ON DELETE CASCADE;

-- Name: multimedia fotos_reportes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.multimedia
    ADD CONSTRAINT fotos_reportes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);

-- Name: historial historial_accion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.historial
    ADD CONSTRAINT historial_accion_id_fkey FOREIGN KEY (accion_id) REFERENCES public.acciones(id);

-- Name: historial historial_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.historial
    ADD CONSTRAINT historial_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);

-- Name: incidente_tags incidente_tags_added_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.incidente_tags
    ADD CONSTRAINT incidente_tags_added_by_fkey FOREIGN KEY (added_by) REFERENCES public.users(id);

-- Name: incidente_tags incidente_tags_reporte_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.incidente_tags
    ADD CONSTRAINT incidente_tags_reporte_id_fkey FOREIGN KEY (reporte_id) REFERENCES public.reporte(id) ON DELETE CASCADE;

-- Name: incidente_tags incidente_tags_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.incidente_tags
    ADD CONSTRAINT incidente_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE;

-- Name: location location_reporte_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.location
    ADD CONSTRAINT location_reporte_id_fkey FOREIGN KEY (reporte_id) REFERENCES public.reporte(id) ON DELETE CASCADE;

-- Name: location location_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.location
    ADD CONSTRAINT location_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);

-- Name: logs logs_incidente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.logs
    ADD CONSTRAINT logs_incidente_id_fkey FOREIGN KEY (incidente_id) REFERENCES public.incidentes(id);

-- Name: notificaciones_counts notificaciones_counts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.notificaciones_counts
    ADD CONSTRAINT notificaciones_counts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Name: notificaciones notificaciones_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.notificaciones
    ADD CONSTRAINT notificaciones_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Name: puntos_origen puntos_origen_reporte_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.puntos_origen
    ADD CONSTRAINT puntos_origen_reporte_id_fkey FOREIGN KEY (reporte_id) REFERENCES public.reporte(id) ON DELETE CASCADE;

-- Name: refresh_tokens refresh_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Name: reporte reporte_incidente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.reporte
    ADD CONSTRAINT reporte_incidente_id_fkey FOREIGN KEY (incidente_id) REFERENCES public.incidentes(id);

-- Name: reporte_tag_counts reporte_tag_counts_reporte_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.reporte_tag_counts
    ADD CONSTRAINT reporte_tag_counts_reporte_id_fkey FOREIGN KEY (reporte_id) REFERENCES public.reporte(id) ON DELETE CASCADE;

-- Name: reporte_tag_counts reporte_tag_counts_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.reporte_tag_counts
    ADD CONSTRAINT reporte_tag_counts_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE;

-- Name: reportes_scores reportes_scores_reporte_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.reportes_scores
    ADD CONSTRAINT reportes_scores_reporte_id_fkey FOREIGN KEY (reporte_id) REFERENCES public.reporte(id) ON DELETE CASCADE;

-- Name: tags tags_incidente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_incidente_id_fkey FOREIGN KEY (incidente_id) REFERENCES public.incidentes(id);

-- Name: users_reports users_reports_reporte_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.users_reports
    ADD CONSTRAINT users_reports_reporte_id_fkey FOREIGN KEY (reporte_id) REFERENCES public.reporte(id) ON DELETE CASCADE;

-- Name: users_reports users_reports_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.users_reports
    ADD CONSTRAINT users_reports_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);

-- Name: users users_rol_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_rol_id_fkey FOREIGN KEY (rol_id) REFERENCES public.roles(id);

-- Roles por defecto. users.rol_id es NOT NULL, así que hacen falta antes de
-- registrar a cualquier usuario.
INSERT INTO roles (nombre) VALUES
    ('ciudadano'),
    ('admin'),
    ('moderador'),
    ('analista'),
    ('proteccion_civil'),
    ('rescatista');

-- Tipos de incidente por defecto, con el color con el que se pintan en el mapa.
-- Hacen falta antes de poder crear reportes.
INSERT INTO incidentes (nombre, tiempo_limite, radio, esta_activo, color) VALUES
    ('luz', 5, 100, true, '#F5C518'),
    ('socavon', 5, 100, true, '#8D6E63'),
    ('arbol', 5, 100, true, '#2E7D32'),
    ('drenaje', 5, 100, true, '#00897B'),
    ('deslave', 5, 100, true, '#E65100'),
    ('inundacion', 5, 100, true, '#1E88E5'),
    ('incendio', 5, 100, true, '#D32F2F');
