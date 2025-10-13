--
-- PostgreSQL database dump
--

\restrict aVcDZOyLedqYk31zAbheJt1qvrncOLhWo9PYO1yizG6dh00cRRkgCxlTpaOazd0

-- Dumped from database version 14.19 (Homebrew)
-- Dumped by pg_dump version 14.19 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: AssetStatus; Type: TYPE; Schema: public; Owner: guillaumestehelin
--

CREATE TYPE public."AssetStatus" AS ENUM (
    'PENDING',
    'UPLOADED',
    'PROCESSING',
    'READY',
    'ERROR'
);


ALTER TYPE public."AssetStatus" OWNER TO guillaumestehelin;

--
-- Name: BatchStatus; Type: TYPE; Schema: public; Owner: guillaumestehelin
--

CREATE TYPE public."BatchStatus" AS ENUM (
    'QUEUED',
    'PROCESSING',
    'PARTIAL',
    'COMPLETED',
    'FAILED'
);


ALTER TYPE public."BatchStatus" OWNER TO guillaumestehelin;

--
-- Name: JobStatus; Type: TYPE; Schema: public; Owner: guillaumestehelin
--

CREATE TYPE public."JobStatus" AS ENUM (
    'PENDING',
    'RUNNING',
    'COMPLETED',
    'FAILED'
);


ALTER TYPE public."JobStatus" OWNER TO guillaumestehelin;

--
-- Name: PhotoStatus; Type: TYPE; Schema: public; Owner: guillaumestehelin
--

CREATE TYPE public."PhotoStatus" AS ENUM (
    'PENDING',
    'PROCESSING',
    'DONE',
    'ERROR'
);


ALTER TYPE public."PhotoStatus" OWNER TO guillaumestehelin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: AiMetric; Type: TABLE; Schema: public; Owner: guillaumestehelin
--

CREATE TABLE public."AiMetric" (
    id text NOT NULL,
    ts timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    provider text NOT NULL,
    model text NOT NULL,
    operation text NOT NULL,
    "latencyMs" integer NOT NULL,
    success boolean NOT NULL,
    "errorType" text,
    retries integer DEFAULT 0 NOT NULL,
    "tokensIn" integer,
    "tokensOut" integer,
    "costUsd" numeric(10,6) DEFAULT 0 NOT NULL,
    meta jsonb
);


ALTER TABLE public."AiMetric" OWNER TO guillaumestehelin;

--
-- Name: AnalyticsEvent; Type: TABLE; Schema: public; Owner: guillaumestehelin
--

CREATE TABLE public."AnalyticsEvent" (
    id text DEFAULT gen_random_uuid() NOT NULL,
    "userId" text NOT NULL,
    "eventType" text NOT NULL,
    metadata jsonb,
    "createdAt" timestamp with time zone DEFAULT now()
);


ALTER TABLE public."AnalyticsEvent" OWNER TO guillaumestehelin;

--
-- Name: Asset; Type: TABLE; Schema: public; Owner: guillaumestehelin
--

CREATE TABLE public."Asset" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "projectId" text,
    filename text NOT NULL,
    "s3Key" text NOT NULL,
    mime text NOT NULL,
    "sizeBytes" integer DEFAULT 0 NOT NULL,
    status public."AssetStatus" DEFAULT 'PENDING'::public."AssetStatus" NOT NULL,
    "uploadedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Asset" OWNER TO guillaumestehelin;

--
-- Name: Batch; Type: TABLE; Schema: public; Owner: guillaumestehelin
--

CREATE TABLE public."Batch" (
    id text NOT NULL,
    "projectId" text NOT NULL,
    "userId" text NOT NULL,
    status public."BatchStatus" DEFAULT 'QUEUED'::public."BatchStatus" NOT NULL,
    "countsQueued" integer DEFAULT 0 NOT NULL,
    "countsProcessing" integer DEFAULT 0 NOT NULL,
    "countsCompleted" integer DEFAULT 0 NOT NULL,
    "countsFailed" integer DEFAULT 0 NOT NULL,
    "inventoryQueued" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Batch" OWNER TO guillaumestehelin;

--
-- Name: Job; Type: TABLE; Schema: public; Owner: guillaumestehelin
--

CREATE TABLE public."Job" (
    id text NOT NULL,
    type text NOT NULL,
    "assetId" text,
    "userId" text NOT NULL,
    status public."JobStatus" DEFAULT 'PENDING'::public."JobStatus" NOT NULL,
    progress integer DEFAULT 0 NOT NULL,
    result jsonb,
    error text,
    "startedAt" timestamp(3) without time zone,
    "completedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Job" OWNER TO guillaumestehelin;

--
-- Name: Photo; Type: TABLE; Schema: public; Owner: guillaumestehelin
--

CREATE TABLE public."Photo" (
    id text NOT NULL,
    "projectId" text NOT NULL,
    filename text NOT NULL,
    "filePath" text NOT NULL,
    url text NOT NULL,
    "roomType" text,
    analysis jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "errorCode" text,
    "errorMessage" text,
    "processedAt" timestamp(3) without time zone,
    status public."PhotoStatus" DEFAULT 'PENDING'::public."PhotoStatus" NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "batchId" text,
    checksum text
);


ALTER TABLE public."Photo" OWNER TO guillaumestehelin;

--
-- Name: Project; Type: TABLE; Schema: public; Owner: guillaumestehelin
--

CREATE TABLE public."Project" (
    id text NOT NULL,
    name text NOT NULL,
    "userId" text NOT NULL,
    "customerName" text,
    "customerEmail" text,
    "customerPhone" text,
    "customerAddress" text,
    "moveDate" timestamp(3) without time zone,
    "currentStep" integer DEFAULT 1 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Project" OWNER TO guillaumestehelin;

--
-- Name: Room; Type: TABLE; Schema: public; Owner: guillaumestehelin
--

CREATE TABLE public."Room" (
    id text NOT NULL,
    name text NOT NULL,
    "roomType" text NOT NULL,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Room" OWNER TO guillaumestehelin;

--
-- Name: User; Type: TABLE; Schema: public; Owner: guillaumestehelin
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."User" OWNER TO guillaumestehelin;

--
-- Name: UserModification; Type: TABLE; Schema: public; Owner: guillaumestehelin
--

CREATE TABLE public."UserModification" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "photoId" text NOT NULL,
    "itemIndex" integer NOT NULL,
    field text NOT NULL,
    value text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."UserModification" OWNER TO guillaumestehelin;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: guillaumestehelin
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO guillaumestehelin;

--
-- Data for Name: AiMetric; Type: TABLE DATA; Schema: public; Owner: guillaumestehelin
--

COPY public."AiMetric" (id, ts, provider, model, operation, "latencyMs", success, "errorType", retries, "tokensIn", "tokensOut", "costUsd", meta) FROM stdin;
\.


--
-- Data for Name: AnalyticsEvent; Type: TABLE DATA; Schema: public; Owner: guillaumestehelin
--

COPY public."AnalyticsEvent" (id, "userId", "eventType", metadata, "createdAt") FROM stdin;
cmgogf0jn00001y13dgdm3ix1	test-user-postgresql	test_postgresql	{"test": true}	2025-10-13 08:28:10.116+07
cmgogx0um00011y138f9mmvl5	test-manual-123	test_manual	{"test": true}	2025-10-13 08:42:10.318+07
cmgogz1iy00021y13fcrvvcg5	test-manual-123	test_manual	{"test": true}	2025-10-13 08:43:44.506+07
cmgogz80v00031y13vi3w7d1a	test-manual-123	test_manual	{"test": true}	2025-10-13 08:43:52.928+07
cmgoh2zn600041y136l4bpdup	temp-ece35736-9e2d-4365-ac8b-5245c8894a17	app_opened	{"userId": "temp-ece35736-9e2d-4365-ac8b-5245c8894a17"}	2025-10-13 08:46:48.69+07
cmgoh3prk00051y13zltgg560	temp-ece35736-9e2d-4365-ac8b-5245c8894a17	room_validation_completed	{"roomCount": 4, "totalPhotos": 9}	2025-10-13 08:47:22.544+07
cmgoh813v00061y13grszij36	temp-ece35736-9e2d-4365-ac8b-5245c8894a17	app_opened	{"userId": "temp-ece35736-9e2d-4365-ac8b-5245c8894a17"}	2025-10-13 08:50:43.867+07
cmgoh8ggo00071y136jkmlex5	temp-ece35736-9e2d-4365-ac8b-5245c8894a17	room_validation_completed	{"roomCount": 4, "totalPhotos": 9}	2025-10-13 08:51:03.769+07
cmgoh9exm00081y13dtlsn0b2	temp-ece35736-9e2d-4365-ac8b-5245c8894a17	app_opened	{"userId": "temp-ece35736-9e2d-4365-ac8b-5245c8894a17"}	2025-10-13 08:51:48.442+07
cmgoh9lnh00091y1362nceat1	temp-ece35736-9e2d-4365-ac8b-5245c8894a17	app_opened	{"userId": "temp-ece35736-9e2d-4365-ac8b-5245c8894a17"}	2025-10-13 08:51:57.149+07
cmgoh9qng000a1y13ga65y9gu	temp-ece35736-9e2d-4365-ac8b-5245c8894a17	photo_uploaded	{"photoId": "3252f5f8-70a4-483d-9203-8b1fa7695d8e", "roomType": "salon", "confidence": 0.95, "duration_ms": 3102}	2025-10-13 08:52:03.629+07
cmgoh9qnr000b1y130kxft1n6	temp-ece35736-9e2d-4365-ac8b-5245c8894a17	photo_uploaded	{"photoId": "318e96b4-4b40-446d-a8a8-a97048e5831e", "roomType": "couloir", "confidence": 0.95, "duration_ms": 3131}	2025-10-13 08:52:03.639+07
cmgoh9qny000c1y13mh82en8v	temp-ece35736-9e2d-4365-ac8b-5245c8894a17	photo_uploaded	{"photoId": "db1910b7-3fad-4df7-b73d-7cf28131a22e", "roomType": "salon", "confidence": 0.95, "duration_ms": 3200}	2025-10-13 08:52:03.647+07
cmgoh9qo8000d1y13d92ugtnr	temp-ece35736-9e2d-4365-ac8b-5245c8894a17	photo_uploaded	{"photoId": "941e07c9-efe0-4aa7-8944-ec9dd5964356", "roomType": "couloir", "confidence": 0.95, "duration_ms": 3311}	2025-10-13 08:52:03.657+07
cmgoh9qw7000e1y130eppo9uh	temp-ece35736-9e2d-4365-ac8b-5245c8894a17	photo_uploaded	{"photoId": "83672692-2ebc-4bcb-b35b-ef2345d5c925", "roomType": "salon", "confidence": 0.95, "duration_ms": 3510}	2025-10-13 08:52:03.943+07
cmgoh9qwi000f1y13b7kqf2wg	temp-ece35736-9e2d-4365-ac8b-5245c8894a17	photo_uploaded	{"photoId": "804c5b61-b5a8-42aa-8cc2-699b80d0a701", "roomType": "couloir", "confidence": 0.95, "duration_ms": 3605}	2025-10-13 08:52:03.954+07
cmgoh9sax000g1y13k9xa36zb	temp-ece35736-9e2d-4365-ac8b-5245c8894a17	photo_uploaded	{"photoId": "b1e96db6-e89c-4730-b8c6-d9cd5060c6f4", "roomType": "chambre", "confidence": 0.98, "duration_ms": 5453}	2025-10-13 08:52:05.769+07
cmgoh9sef000h1y13a1ast6re	temp-ece35736-9e2d-4365-ac8b-5245c8894a17	photo_uploaded	{"photoId": "087717f3-2262-49bc-aaff-0996ef8da3a9", "roomType": "chambre", "confidence": 0.95, "duration_ms": 5594}	2025-10-13 08:52:05.895+07
cmgoh9sii000i1y13ee0u4t6t	temp-ece35736-9e2d-4365-ac8b-5245c8894a17	photo_uploaded	{"photoId": "a1646f91-15ee-43fe-aedc-666a53f3bcc5", "roomType": "salle_a_manger", "confidence": 0.95, "duration_ms": 5740}	2025-10-13 08:52:06.043+07
cmgohcmoy000j1y13lg3ehenl	temp-ece35736-9e2d-4365-ac8b-5245c8894a17	app_opened	{"userId": "temp-ece35736-9e2d-4365-ac8b-5245c8894a17"}	2025-10-13 08:54:18.466+07
cmgohdj7u000k1y13h969pc6e	temp-ece35736-9e2d-4365-ac8b-5245c8894a17	room_validation_completed	{"roomCount": 3, "totalPhotos": 9}	2025-10-13 08:55:00.618+07
cmgohguip000l1y137fn2qwde	temp-ece35736-9e2d-4365-ac8b-5245c8894a17	app_opened	{"userId": "temp-ece35736-9e2d-4365-ac8b-5245c8894a17"}	2025-10-13 08:57:35.233+07
cmgohh4qz000m1y13dz4l7pki	temp-ece35736-9e2d-4365-ac8b-5245c8894a17	app_opened	{"userId": "temp-ece35736-9e2d-4365-ac8b-5245c8894a17"}	2025-10-13 08:57:48.491+07
cmgohhaoi000n1y13hk8er06s	temp-ece35736-9e2d-4365-ac8b-5245c8894a17	photo_uploaded	{"photoId": "ac8cd64a-4d25-42a2-9a37-7fbffcad2ec3", "roomType": "salon", "confidence": 0.95, "duration_ms": 3090}	2025-10-13 08:57:56.178+07
cmgohhaot000o1y13os7f3f61	temp-ece35736-9e2d-4365-ac8b-5245c8894a17	photo_uploaded	{"photoId": "ad83a5b6-0cec-4d2c-9a80-fd873469cfd0", "roomType": "couloir", "confidence": 0.95, "duration_ms": 3117}	2025-10-13 08:57:56.189+07
cmgohhap0000p1y134dgrngru	temp-ece35736-9e2d-4365-ac8b-5245c8894a17	photo_uploaded	{"photoId": "4705e883-79e6-44ef-abee-fac39f478b4a", "roomType": "couloir", "confidence": 0.95, "duration_ms": 3144}	2025-10-13 08:57:56.196+07
cmgohhap8000q1y13lnfyp1jn	temp-ece35736-9e2d-4365-ac8b-5245c8894a17	photo_uploaded	{"photoId": "1ce891c6-fb6b-44e9-8a15-3967f5e0b967", "roomType": "salon", "confidence": 0.95, "duration_ms": 3169}	2025-10-13 08:57:56.204+07
cmgohhaz6000r1y13erm0yli9	temp-ece35736-9e2d-4365-ac8b-5245c8894a17	photo_uploaded	{"photoId": "6c0e668a-7aac-4983-b174-f10c0e1b037a", "roomType": "couloir", "confidence": 0.95, "duration_ms": 3330}	2025-10-13 08:57:56.563+07
cmgohhb0x000s1y13s1ajywdd	temp-ece35736-9e2d-4365-ac8b-5245c8894a17	photo_uploaded	{"photoId": "6ebbef63-2b0b-417f-b0e1-d3f7aa222102", "roomType": "salon", "confidence": 0.95, "duration_ms": 3603}	2025-10-13 08:57:56.625+07
cmgohhcbf000t1y13pu80m4kh	temp-ece35736-9e2d-4365-ac8b-5245c8894a17	photo_uploaded	{"photoId": "bf48ac28-9f0b-4083-ba57-37be21239039", "roomType": "chambre", "confidence": 0.98, "duration_ms": 5265}	2025-10-13 08:57:58.299+07
cmgohhckk000u1y13pk0z7xo2	temp-ece35736-9e2d-4365-ac8b-5245c8894a17	photo_uploaded	{"photoId": "c91aeac6-9225-4aa6-9cde-b99800ce55a1", "roomType": "salle_a_manger", "confidence": 0.95, "duration_ms": 5607}	2025-10-13 08:57:58.629+07
cmgohhcmn000v1y13ze26gzw7	temp-ece35736-9e2d-4365-ac8b-5245c8894a17	photo_uploaded	{"photoId": "601f4ee2-e5ab-42f5-a697-8f46e24c1cd3", "roomType": "chambre", "confidence": 0.95, "duration_ms": 5683}	2025-10-13 08:57:58.704+07
cmgohhy7m000w1y13qocwby95	temp-ece35736-9e2d-4365-ac8b-5245c8894a17	room_validation_completed	{"roomCount": 3, "totalPhotos": 9}	2025-10-13 08:58:26.675+07
cmgohl126000x1y13tp0hc5pl	temp-ece35736-9e2d-4365-ac8b-5245c8894a17	step_reached	{"step": 4}	2025-10-13 09:00:50.334+07
cmgohl2pb000y1y13mn73bvcc	temp-ece35736-9e2d-4365-ac8b-5245c8894a17	step_reached	{"step": 3}	2025-10-13 09:00:52.463+07
\.


--
-- Data for Name: Asset; Type: TABLE DATA; Schema: public; Owner: guillaumestehelin
--

COPY public."Asset" (id, "userId", "projectId", filename, "s3Key", mime, "sizeBytes", status, "uploadedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Batch; Type: TABLE DATA; Schema: public; Owner: guillaumestehelin
--

COPY public."Batch" (id, "projectId", "userId", status, "countsQueued", "countsProcessing", "countsCompleted", "countsFailed", "inventoryQueued", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Job; Type: TABLE DATA; Schema: public; Owner: guillaumestehelin
--

COPY public."Job" (id, type, "assetId", "userId", status, progress, result, error, "startedAt", "completedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Photo; Type: TABLE DATA; Schema: public; Owner: guillaumestehelin
--

COPY public."Photo" (id, "projectId", filename, "filePath", url, "roomType", analysis, "createdAt", "errorCode", "errorMessage", "processedAt", status, "updatedAt", "batchId", checksum) FROM stdin;
ad83a5b6-0cec-4d2c-9a80-fd873469cfd0	a0b99114-ad22-45f8-ae34-4e3864d9796f	ad83a5b6-0cec-4d2c-9a80-fd873469cfd0.jpeg	/Users/guillaumestehelin/moverz_v3-1/uploads/ad83a5b6-0cec-4d2c-9a80-fd873469cfd0.jpeg	/api/uploads/ad83a5b6-0cec-4d2c-9a80-fd873469cfd0.jpeg	couloir	null	2025-10-13 01:57:56.107	\N	\N	\N	PENDING	2025-10-13 01:57:56.107	\N	\N
4705e883-79e6-44ef-abee-fac39f478b4a	a0b99114-ad22-45f8-ae34-4e3864d9796f	4705e883-79e6-44ef-abee-fac39f478b4a.jpeg	/Users/guillaumestehelin/moverz_v3-1/uploads/4705e883-79e6-44ef-abee-fac39f478b4a.jpeg	/api/uploads/4705e883-79e6-44ef-abee-fac39f478b4a.jpeg	couloir	null	2025-10-13 01:57:56.134	\N	\N	\N	PENDING	2025-10-13 01:57:56.134	\N	\N
1ce891c6-fb6b-44e9-8a15-3967f5e0b967	a0b99114-ad22-45f8-ae34-4e3864d9796f	1ce891c6-fb6b-44e9-8a15-3967f5e0b967.jpeg	/Users/guillaumestehelin/moverz_v3-1/uploads/1ce891c6-fb6b-44e9-8a15-3967f5e0b967.jpeg	/api/uploads/1ce891c6-fb6b-44e9-8a15-3967f5e0b967.jpeg	salon	null	2025-10-13 01:57:56.153	\N	\N	\N	PENDING	2025-10-13 01:57:56.153	\N	\N
6ebbef63-2b0b-417f-b0e1-d3f7aa222102	a0b99114-ad22-45f8-ae34-4e3864d9796f	6ebbef63-2b0b-417f-b0e1-d3f7aa222102.jpeg	/Users/guillaumestehelin/moverz_v3-1/uploads/6ebbef63-2b0b-417f-b0e1-d3f7aa222102.jpeg	/api/uploads/6ebbef63-2b0b-417f-b0e1-d3f7aa222102.jpeg	salon	null	2025-10-13 01:57:56.612	\N	\N	\N	PENDING	2025-10-13 01:57:56.612	\N	\N
c91aeac6-9225-4aa6-9cde-b99800ce55a1	a0b99114-ad22-45f8-ae34-4e3864d9796f	c91aeac6-9225-4aa6-9cde-b99800ce55a1.jpeg	/Users/guillaumestehelin/moverz_v3-1/uploads/c91aeac6-9225-4aa6-9cde-b99800ce55a1.jpeg	/api/uploads/c91aeac6-9225-4aa6-9cde-b99800ce55a1.jpeg	salle_a_manger	null	2025-10-13 01:57:58.617	\N	\N	\N	PENDING	2025-10-13 01:57:58.617	\N	\N
601f4ee2-e5ab-42f5-a697-8f46e24c1cd3	a0b99114-ad22-45f8-ae34-4e3864d9796f	601f4ee2-e5ab-42f5-a697-8f46e24c1cd3.jpeg	/Users/guillaumestehelin/moverz_v3-1/uploads/601f4ee2-e5ab-42f5-a697-8f46e24c1cd3.jpeg	/api/uploads/601f4ee2-e5ab-42f5-a697-8f46e24c1cd3.jpeg	chambre	null	2025-10-13 01:57:58.691	\N	\N	\N	PENDING	2025-10-13 01:57:58.691	\N	\N
6c0e668a-7aac-4983-b174-f10c0e1b037a	a0b99114-ad22-45f8-ae34-4e3864d9796f	6c0e668a-7aac-4983-b174-f10c0e1b037a.jpeg	/Users/guillaumestehelin/moverz_v3-1/uploads/6c0e668a-7aac-4983-b174-f10c0e1b037a.jpeg	/api/uploads/6c0e668a-7aac-4983-b174-f10c0e1b037a.jpeg	couloir	{"items": [{"label": "console", "notes": null, "fragile": false, "category": "furniture", "quantity": 1, "stackable": false, "volume_m3": 0.32, "confidence": 0.9, "dismountable": true, "dimensions_cm": {"width": 40, "height": 80, "length": 100, "source": "estimated"}, "is_small_object": false, "textile_included": false, "packaging_display": "0.235 M³ emballés", "packaged_volume_m3": 0.2352, "dismountable_source": "ai", "dismountable_confidence": 0.8, "packaging_calculation_details": "📏 DIMENSIONS\\n100×40×80cm (max: 100cm)\\n\\n🔧 RÈGLE TYPE D'OBJET\\nMeuble non fragile → Volume + 5%\\n\\n🔧 RÈGLE DÉMONTABILITÉ\\nObjet démontable → Volume - 30%\\nVolume avant: 0.336 m³\\nVolume après: 0.235 m³\\n\\n📦 RÈGLE DU CARTON\\nDimension max: 100cm\\nCarton max: 50cm\\nRésultat: ✗ Trop grand pour carton\\n\\n📊 DIMENSION EMBALLÉE\\nVolume original: 0.320 m³\\nVolume emballé: 0.235 m³\\n\\nAffichage: 0.235 m³ emballés"}, {"label": "cadre photo/tableau", "notes": "Cadres muraux de différentes tailles", "fragile": true, "category": "art", "quantity": 3, "stackable": false, "volume_m3": 0.024, "confidence": 0.9, "dismountable": true, "dimensions_cm": {"width": 5, "height": 80, "length": 60, "source": "estimated"}, "is_small_object": false, "textile_included": false, "packaging_display": "0.034 M³ emballés", "packaged_volume_m3": 0.0336, "dismountable_source": "ai", "dismountable_confidence": 0.9, "packaging_calculation_details": "📏 DIMENSIONS\\n60×5×80cm (max: 80cm)\\n\\n🔧 RÈGLE TYPE D'OBJET\\nObjet fragile → Volume × 2\\n\\n🔧 RÈGLE DÉMONTABILITÉ\\nObjet démontable → Volume - 30%\\nVolume avant: 0.048 m³\\nVolume après: 0.034 m³\\n\\n📦 RÈGLE DU CARTON\\nDimension max: 80cm\\nCarton max: 50cm\\nRésultat: ✗ Trop grand pour carton\\n\\n📊 DIMENSION EMBALLÉE\\nVolume original: 0.024 m³\\nVolume emballé: 0.034 m³\\n\\nAffichage: 0.034 m³ emballés"}, {"label": "armoire/placard", "notes": "Placard mural blanc avec portes", "fragile": false, "category": "furniture", "quantity": 1, "stackable": false, "volume_m3": 3, "confidence": 0.95, "dismountable": true, "dimensions_cm": {"width": 60, "height": 250, "length": 200, "source": "estimated"}, "is_small_object": false, "textile_included": false, "packaging_display": "2.205 M³ emballés", "packaged_volume_m3": 2.205, "dismountable_source": "hybrid", "dismountable_confidence": 0.8, "packaging_calculation_details": "📏 DIMENSIONS\\n200×60×250cm (max: 250cm)\\n\\n🔧 RÈGLE TYPE D'OBJET\\nMeuble non fragile → Volume + 5%\\n\\n🔧 RÈGLE DÉMONTABILITÉ\\nObjet démontable → Volume - 30%\\nVolume avant: 3.150 m³\\nVolume après: 2.205 m³\\n\\n📦 RÈGLE DU CARTON\\nDimension max: 250cm\\nCarton max: 50cm\\nRésultat: ✗ Trop grand pour carton\\n\\n📊 DIMENSION EMBALLÉE\\nVolume original: 3.000 m³\\nVolume emballé: 2.205 m³\\n\\nAffichage: 2.205 m³ emballés"}, {"label": "étagère bibliothèque", "notes": "Étagère ouverte avec livres", "fragile": false, "category": "furniture", "quantity": 1, "stackable": true, "volume_m3": 0.54, "confidence": 0.9, "dismountable": true, "dimensions_cm": {"width": 30, "height": 180, "length": 100, "source": "estimated"}, "is_small_object": false, "textile_included": false, "packaging_display": "0.397 M³ emballés", "packaged_volume_m3": 0.3969, "dismountable_source": "ai", "dismountable_confidence": 0.8, "packaging_calculation_details": "📏 DIMENSIONS\\n100×30×180cm (max: 180cm)\\n\\n🔧 RÈGLE TYPE D'OBJET\\nMeuble non fragile → Volume + 5%\\n\\n🔧 RÈGLE DÉMONTABILITÉ\\nObjet démontable → Volume - 30%\\nVolume avant: 0.567 m³\\nVolume après: 0.397 m³\\n\\n📦 RÈGLE DU CARTON\\nDimension max: 180cm\\nCarton max: 50cm\\nRésultat: ✗ Trop grand pour carton\\n\\n📊 DIMENSION EMBALLÉE\\nVolume original: 0.540 m³\\nVolume emballé: 0.397 m³\\n\\nAffichage: 0.397 m³ emballés"}, {"label": "livres", "notes": "Estimation du nombre de livres sur l'étagère", "fragile": false, "category": "misc", "quantity": 15, "stackable": true, "volume_m3": 0.007, "confidence": 0.8, "dismountable": false, "dimensions_cm": {"width": 15, "height": 25, "length": 20, "source": "estimated"}, "is_small_object": true, "textile_included": false, "packaging_display": "12.9% d'un carton", "packaged_volume_m3": 0.007700000000000001, "dismountable_source": "database", "dismountable_confidence": 0.3, "packaging_calculation_details": "📏 DIMENSIONS\\n20×15×25cm (max: 25cm)\\n\\n🔧 RÈGLE TYPE D'OBJET\\nPetit objet non fragile → Volume + 10%\\n\\n📦 RÈGLE DU CARTON\\nDimension max: 25cm\\nCarton max: 50cm\\nRésultat: ✓ Rentré dans carton\\n\\n📊 DIMENSION EMBALLÉE\\nVolume original: 0.007 m³\\nVolume emballé: 0.008 m³\\n\\nPourcentage carton:\\n0.008 ÷ 0.060 = 12.8%\\nArrondi supérieur: 12.9%"}, {"label": "vase/objet décoratif", "notes": "Objet décoratif sur la console", "fragile": true, "category": "misc", "quantity": 1, "stackable": false, "volume_m3": 0.025, "confidence": 0.7, "dismountable": false, "dimensions_cm": {"width": 20, "height": 30, "length": 20, "source": "estimated"}, "is_small_object": true, "textile_included": false, "packaging_display": "83.4% d'un carton", "packaged_volume_m3": 0.05, "dismountable_source": "database", "dismountable_confidence": 0.3, "packaging_calculation_details": "📏 DIMENSIONS\\n20×20×30cm (max: 30cm)\\n\\n🔧 RÈGLE TYPE D'OBJET\\nObjet fragile → Volume × 2\\n\\n📦 RÈGLE DU CARTON\\nDimension max: 30cm\\nCarton max: 50cm\\nRésultat: ✓ Rentré dans carton\\n\\n📊 DIMENSION EMBALLÉE\\nVolume original: 0.025 m³\\nVolume emballé: 0.050 m³\\n\\nPourcentage carton:\\n0.050 ÷ 0.060 = 83.3%\\nArrondi supérieur: 83.4%"}], "errors": [], "totals": {"volume_m3": 4.162, "count_items": 24}, "version": "1.0.0", "photo_id": "ad83a5b6-0cec-4d2c-9a80-fd873469cfd0,4705e883-79e6-44ef-abee-fac39f478b4a,6c0e668a-7aac-4983-b174-f10c0e1b037a", "roomType": "couloir", "warnings": [], "photoCount": 3, "analysisType": "room-based-claude", "special_rules": {"autres_objets": {"present": true, "volume_m3": 0.1, "listed_items": ["accessoires", "petit matériel"]}}, "_groupPhotoIds": ["6c0e668a-7aac-4983-b174-f10c0e1b037a", "ad83a5b6-0cec-4d2c-9a80-fd873469cfd0", "4705e883-79e6-44ef-abee-fac39f478b4a"], "_analysisVersion": 1, "_isGroupAnalysis": true}	2025-10-13 01:57:56.332	\N	\N	\N	PENDING	2025-10-13 01:58:22.819	\N	\N
bf48ac28-9f0b-4083-ba57-37be21239039	a0b99114-ad22-45f8-ae34-4e3864d9796f	bf48ac28-9f0b-4083-ba57-37be21239039.jpeg	/Users/guillaumestehelin/moverz_v3-1/uploads/bf48ac28-9f0b-4083-ba57-37be21239039.jpeg	/api/uploads/bf48ac28-9f0b-4083-ba57-37be21239039.jpeg	chambre	{"items": [{"label": "lit double (structure)", "notes": "Lit standard double", "fragile": false, "category": "furniture", "quantity": 1, "stackable": false, "volume_m3": 1.28, "confidence": 0.95, "dismountable": true, "dimensions_cm": {"width": 190, "height": 40, "length": 140, "source": "estimated"}, "is_small_object": false, "textile_included": false, "packaging_display": "0.941 M³ emballés", "packaged_volume_m3": 0.9408, "dismountable_source": "ai", "dismountable_confidence": 0.9, "packaging_calculation_details": "📏 DIMENSIONS\\n140×190×40cm (max: 190cm)\\n\\n🔧 RÈGLE TYPE D'OBJET\\nMeuble non fragile → Volume + 5%\\n\\n🔧 RÈGLE DÉMONTABILITÉ\\nObjet démontable → Volume - 30%\\nVolume avant: 1.344 m³\\nVolume après: 0.941 m³\\n\\n📦 RÈGLE DU CARTON\\nDimension max: 190cm\\nCarton max: 50cm\\nRésultat: ✗ Trop grand pour carton\\n\\n📊 DIMENSION EMBALLÉE\\nVolume original: 1.280 m³\\nVolume emballé: 0.941 m³\\n\\nAffichage: 0.941 m³ emballés"}, {"label": "matelas double", "notes": "Matelas avec parure de lit incluse", "fragile": false, "category": "furniture", "quantity": 1, "stackable": false, "volume_m3": 0.57, "confidence": 0.95, "dismountable": false, "dimensions_cm": {"width": 190, "height": 20, "length": 140, "source": "estimated"}, "is_small_object": false, "textile_included": true, "packaging_display": "0.598 M³ emballés", "packaged_volume_m3": 0.5984999999999999, "dismountable_source": "database", "dismountable_confidence": 0, "packaging_calculation_details": "📏 DIMENSIONS\\n140×190×20cm (max: 190cm)\\n\\n🔧 RÈGLE TYPE D'OBJET\\nMeuble non fragile → Volume + 5%\\n\\n📦 RÈGLE DU CARTON\\nDimension max: 190cm\\nCarton max: 50cm\\nRésultat: ✗ Trop grand pour carton\\n\\n📊 DIMENSION EMBALLÉE\\nVolume original: 0.570 m³\\nVolume emballé: 0.598 m³\\n\\nAffichage: 0.598 m³ emballés"}, {"label": "armoire en bois", "notes": "Armoire ancienne en bois massif", "fragile": false, "category": "furniture", "quantity": 1, "stackable": false, "volume_m3": 1.2, "confidence": 0.9, "dismountable": true, "dimensions_cm": {"width": 60, "height": 200, "length": 100, "source": "estimated"}, "is_small_object": false, "textile_included": false, "packaging_display": "0.882 M³ emballés", "packaged_volume_m3": 0.8819999999999999, "dismountable_source": "ai", "dismountable_confidence": 0.8, "packaging_calculation_details": "📏 DIMENSIONS\\n100×60×200cm (max: 200cm)\\n\\n🔧 RÈGLE TYPE D'OBJET\\nMeuble non fragile → Volume + 5%\\n\\n🔧 RÈGLE DÉMONTABILITÉ\\nObjet démontable → Volume - 30%\\nVolume avant: 1.260 m³\\nVolume après: 0.882 m³\\n\\n📦 RÈGLE DU CARTON\\nDimension max: 200cm\\nCarton max: 50cm\\nRésultat: ✗ Trop grand pour carton\\n\\n📊 DIMENSION EMBALLÉE\\nVolume original: 1.200 m³\\nVolume emballé: 0.882 m³\\n\\nAffichage: 0.882 m³ emballés"}, {"label": "armoire (contenu éventuel)", "notes": "Estimation contenu - à ajuster", "fragile": false, "category": "misc", "quantity": 1, "stackable": true, "volume_m3": 0.6, "confidence": 0.6, "dismountable": true, "dimensions_cm": {"width": 60, "height": 100, "length": 100, "source": "estimated"}, "is_small_object": false, "textile_included": false, "packaging_display": "0.630 M³ emballés", "packaged_volume_m3": 0.63, "dismountable_source": "database", "dismountable_confidence": 0.9, "packaging_calculation_details": "📏 DIMENSIONS\\n100×60×100cm (max: 100cm)\\n\\n🔧 RÈGLE TYPE D'OBJET\\nMeuble non fragile → Volume + 5%\\n\\n📦 RÈGLE DU CARTON\\nDimension max: 100cm\\nCarton max: 50cm\\nRésultat: ✗ Trop grand pour carton\\n\\n📊 DIMENSION EMBALLÉE\\nVolume original: 0.600 m³\\nVolume emballé: 0.630 m³\\n\\nAffichage: 0.630 m³ emballés"}, {"label": "téléviseur", "notes": "Écran plat, probablement LED", "fragile": true, "category": "appliance", "quantity": 1, "stackable": false, "volume_m3": 0.04, "confidence": 0.8, "dismountable": false, "dimensions_cm": {"width": 10, "height": 50, "length": 80, "source": "estimated"}, "is_small_object": false, "textile_included": false, "packaging_display": "0.080 M³ emballés", "packaged_volume_m3": 0.08, "dismountable_source": "database", "dismountable_confidence": 0.3, "packaging_calculation_details": "📏 DIMENSIONS\\n80×10×50cm (max: 80cm)\\n\\n🔧 RÈGLE TYPE D'OBJET\\nObjet fragile → Volume × 2\\n\\n📦 RÈGLE DU CARTON\\nDimension max: 80cm\\nCarton max: 50cm\\nRésultat: ✗ Trop grand pour carton\\n\\n📊 DIMENSION EMBALLÉE\\nVolume original: 0.040 m³\\nVolume emballé: 0.080 m³\\n\\nAffichage: 0.080 m³ emballés"}, {"label": "tableau décoratif", "notes": "Triptyque artistique au-dessus du lit", "fragile": true, "category": "art", "quantity": 3, "stackable": false, "volume_m3": 0.024, "confidence": 0.9, "dismountable": true, "dimensions_cm": {"width": 5, "height": 40, "length": 60, "source": "estimated"}, "is_small_object": false, "textile_included": false, "packaging_display": "0.034 M³ emballés", "packaged_volume_m3": 0.0336, "dismountable_source": "ai", "dismountable_confidence": 0.9, "packaging_calculation_details": "📏 DIMENSIONS\\n60×5×40cm (max: 60cm)\\n\\n🔧 RÈGLE TYPE D'OBJET\\nObjet fragile → Volume × 2\\n\\n🔧 RÈGLE DÉMONTABILITÉ\\nObjet démontable → Volume - 30%\\nVolume avant: 0.048 m³\\nVolume après: 0.034 m³\\n\\n📦 RÈGLE DU CARTON\\nDimension max: 60cm\\nCarton max: 50cm\\nRésultat: ✗ Trop grand pour carton\\n\\n📊 DIMENSION EMBALLÉE\\nVolume original: 0.024 m³\\nVolume emballé: 0.034 m³\\n\\nAffichage: 0.034 m³ emballés"}, {"label": "lampe de chevet", "notes": "Lampe blanche sur table de chevet", "fragile": true, "category": "misc", "quantity": 1, "stackable": false, "volume_m3": 0.135, "confidence": 0.7, "dismountable": true, "dimensions_cm": {"width": 20, "height": 30, "length": 20, "source": "estimated"}, "is_small_object": false, "textile_included": false, "packaging_display": "0.189 M³ emballés", "packaged_volume_m3": 0.189, "dismountable_source": "ai", "dismountable_confidence": 0.8, "packaging_calculation_details": "📏 DIMENSIONS\\n20×20×30cm (max: 30cm)\\n\\n🔧 RÈGLE TYPE D'OBJET\\nObjet fragile → Volume × 2\\n\\n🔧 RÈGLE DÉMONTABILITÉ\\nObjet démontable → Volume - 30%\\nVolume avant: 0.270 m³\\nVolume après: 0.189 m³\\n\\n📦 RÈGLE DU CARTON\\nDimension max: 30cm\\nCarton max: 50cm\\nRésultat: ✓ Rentré dans carton\\n\\n📊 DIMENSION EMBALLÉE\\nVolume original: 0.135 m³\\nVolume emballé: 0.189 m³\\n\\nAffichage: 0.189 m³ emballés"}], "errors": [], "totals": {"volume_m3": 4.097, "count_items": 12}, "version": "1.0.0", "photo_id": "bf48ac28-9f0b-4083-ba57-37be21239039,601f4ee2-e5ab-42f5-a697-8f46e24c1cd3", "roomType": "chambre", "warnings": [], "photoCount": 2, "analysisType": "room-based-claude", "special_rules": {"autres_objets": {"present": true, "volume_m3": 0.2, "listed_items": ["coussins", "rideaux", "objets décoratifs"]}}, "_groupPhotoIds": ["bf48ac28-9f0b-4083-ba57-37be21239039", "601f4ee2-e5ab-42f5-a697-8f46e24c1cd3"], "_analysisVersion": 1, "_isGroupAnalysis": true}	2025-10-13 01:57:58.263	\N	\N	\N	PENDING	2025-10-13 01:58:24.937	\N	\N
ac8cd64a-4d25-42a2-9a37-7fbffcad2ec3	a0b99114-ad22-45f8-ae34-4e3864d9796f	ac8cd64a-4d25-42a2-9a37-7fbffcad2ec3.jpeg	/Users/guillaumestehelin/moverz_v3-1/uploads/ac8cd64a-4d25-42a2-9a37-7fbffcad2ec3.jpeg	/api/uploads/ac8cd64a-4d25-42a2-9a37-7fbffcad2ec3.jpeg	salon	{"items": [{"label": "canapé rouge", "notes": "Canapé deux places", "fragile": false, "category": "furniture", "quantity": 1, "stackable": false, "volume_m3": 1.458, "confidence": 0.95, "dismountable": false, "dimensions_cm": {"width": 90, "height": 90, "length": 180, "source": "estimated"}, "is_small_object": false, "textile_included": true, "packaging_display": "1.531 M³ emballés", "packaged_volume_m3": 1.5309, "dismountable_source": "database", "dismountable_confidence": 0.2, "packaging_calculation_details": "📏 DIMENSIONS\\n180×90×90cm (max: 180cm)\\n\\n🔧 RÈGLE TYPE D'OBJET\\nMeuble non fragile → Volume + 5%\\n\\n📦 RÈGLE DU CARTON\\nDimension max: 180cm\\nCarton max: 50cm\\nRésultat: ✗ Trop grand pour carton\\n\\n📊 DIMENSION EMBALLÉE\\nVolume original: 1.458 m³\\nVolume emballé: 1.531 m³\\n\\nAffichage: 1.531 m³ emballés"}, {"label": "table à manger", "notes": "Table rectangulaire en bois foncé", "fragile": false, "category": "furniture", "quantity": 1, "stackable": false, "volume_m3": 1.215, "confidence": 0.95, "dismountable": true, "dimensions_cm": {"width": 90, "height": 75, "length": 180, "source": "estimated"}, "is_small_object": false, "textile_included": false, "packaging_display": "0.893 M³ emballés", "packaged_volume_m3": 0.8930250000000001, "dismountable_source": "ai", "dismountable_confidence": 0.8, "packaging_calculation_details": "📏 DIMENSIONS\\n180×90×75cm (max: 180cm)\\n\\n🔧 RÈGLE TYPE D'OBJET\\nMeuble non fragile → Volume + 5%\\n\\n🔧 RÈGLE DÉMONTABILITÉ\\nObjet démontable → Volume - 30%\\nVolume avant: 1.276 m³\\nVolume après: 0.893 m³\\n\\n📦 RÈGLE DU CARTON\\nDimension max: 180cm\\nCarton max: 50cm\\nRésultat: ✗ Trop grand pour carton\\n\\n📊 DIMENSION EMBALLÉE\\nVolume original: 1.215 m³\\nVolume emballé: 0.893 m³\\n\\nAffichage: 0.893 m³ emballés"}, {"label": "chaise de table", "notes": "Chaises beiges/grises", "fragile": false, "category": "furniture", "quantity": 4, "stackable": false, "volume_m3": 0.18225, "confidence": 0.9, "dismountable": true, "dimensions_cm": {"width": 50, "height": 90, "length": 50, "source": "estimated"}, "is_small_object": false, "textile_included": false, "packaging_display": "0.134 M³ emballés", "packaged_volume_m3": 0.13395375, "dismountable_source": "ai", "dismountable_confidence": 0.9, "packaging_calculation_details": "📏 DIMENSIONS\\n50×50×90cm (max: 90cm)\\n\\n🔧 RÈGLE TYPE D'OBJET\\nMeuble non fragile → Volume + 5%\\n\\n🔧 RÈGLE DÉMONTABILITÉ\\nObjet démontable → Volume - 30%\\nVolume avant: 0.191 m³\\nVolume après: 0.134 m³\\n\\n📦 RÈGLE DU CARTON\\nDimension max: 90cm\\nCarton max: 50cm\\nRésultat: ✗ Trop grand pour carton\\n\\n📊 DIMENSION EMBALLÉE\\nVolume original: 0.182 m³\\nVolume emballé: 0.134 m³\\n\\nAffichage: 0.134 m³ emballés"}, {"label": "armoire ancienne", "notes": "Armoire en bois ancien avec motifs sculptés", "fragile": false, "category": "furniture", "quantity": 1, "stackable": false, "volume_m3": 1.584, "confidence": 0.95, "dismountable": true, "dimensions_cm": {"width": 60, "height": 220, "length": 120, "source": "estimated"}, "is_small_object": false, "textile_included": false, "packaging_display": "1.164 M³ emballés", "packaged_volume_m3": 1.16424, "dismountable_source": "hybrid", "dismountable_confidence": 0.8, "packaging_calculation_details": "📏 DIMENSIONS\\n120×60×220cm (max: 220cm)\\n\\n🔧 RÈGLE TYPE D'OBJET\\nMeuble non fragile → Volume + 5%\\n\\n🔧 RÈGLE DÉMONTABILITÉ\\nObjet démontable → Volume - 30%\\nVolume avant: 1.663 m³\\nVolume après: 1.164 m³\\n\\n📦 RÈGLE DU CARTON\\nDimension max: 220cm\\nCarton max: 50cm\\nRésultat: ✗ Trop grand pour carton\\n\\n📊 DIMENSION EMBALLÉE\\nVolume original: 1.584 m³\\nVolume emballé: 1.164 m³\\n\\nAffichage: 1.164 m³ emballés"}, {"label": "tableau décoratif", "notes": "Tableau artistique bleu et coloré", "fragile": true, "category": "art", "quantity": 1, "stackable": false, "volume_m3": 0.024, "confidence": 0.9, "dismountable": true, "dimensions_cm": {"width": 10, "height": 150, "length": 120, "source": "estimated"}, "is_small_object": false, "textile_included": false, "packaging_display": "0.034 M³ emballés", "packaged_volume_m3": 0.0336, "dismountable_source": "ai", "dismountable_confidence": 0.9, "packaging_calculation_details": "📏 DIMENSIONS\\n120×10×150cm (max: 150cm)\\n\\n🔧 RÈGLE TYPE D'OBJET\\nObjet fragile → Volume × 2\\n\\n🔧 RÈGLE DÉMONTABILITÉ\\nObjet démontable → Volume - 30%\\nVolume avant: 0.048 m³\\nVolume après: 0.034 m³\\n\\n📦 RÈGLE DU CARTON\\nDimension max: 150cm\\nCarton max: 50cm\\nRésultat: ✗ Trop grand pour carton\\n\\n📊 DIMENSION EMBALLÉE\\nVolume original: 0.024 m³\\nVolume emballé: 0.034 m³\\n\\nAffichage: 0.034 m³ emballés"}, {"label": "bibliothèque", "notes": "Bibliothèque blanche avec étagères", "fragile": false, "category": "furniture", "quantity": 1, "stackable": false, "volume_m3": 0.8, "confidence": 0.9, "dismountable": true, "dimensions_cm": {"width": 40, "height": 200, "length": 100, "source": "estimated"}, "is_small_object": false, "textile_included": false, "packaging_display": "0.588 M³ emballés", "packaged_volume_m3": 0.588, "dismountable_source": "ai", "dismountable_confidence": 0.8, "packaging_calculation_details": "📏 DIMENSIONS\\n100×40×200cm (max: 200cm)\\n\\n🔧 RÈGLE TYPE D'OBJET\\nMeuble non fragile → Volume + 5%\\n\\n🔧 RÈGLE DÉMONTABILITÉ\\nObjet démontable → Volume - 30%\\nVolume avant: 0.840 m³\\nVolume après: 0.588 m³\\n\\n📦 RÈGLE DU CARTON\\nDimension max: 200cm\\nCarton max: 50cm\\nRésultat: ✗ Trop grand pour carton\\n\\n📊 DIMENSION EMBALLÉE\\nVolume original: 0.800 m³\\nVolume emballé: 0.588 m³\\n\\nAffichage: 0.588 m³ emballés"}, {"label": "table basse", "notes": "Table basse en bois avec livres", "fragile": false, "category": "furniture", "quantity": 1, "stackable": true, "volume_m3": 0.297, "confidence": 0.9, "dismountable": true, "dimensions_cm": {"width": 60, "height": 45, "length": 100, "source": "estimated"}, "is_small_object": false, "textile_included": false, "packaging_display": "0.218 M³ emballés", "packaged_volume_m3": 0.218295, "dismountable_source": "hybrid", "dismountable_confidence": 0.6, "packaging_calculation_details": "📏 DIMENSIONS\\n100×60×45cm (max: 100cm)\\n\\n🔧 RÈGLE TYPE D'OBJET\\nMeuble non fragile → Volume + 5%\\n\\n🔧 RÈGLE DÉMONTABILITÉ\\nObjet démontable → Volume - 30%\\nVolume avant: 0.312 m³\\nVolume après: 0.218 m³\\n\\n📦 RÈGLE DU CARTON\\nDimension max: 100cm\\nCarton max: 50cm\\nRésultat: ✗ Trop grand pour carton\\n\\n📊 DIMENSION EMBALLÉE\\nVolume original: 0.297 m³\\nVolume emballé: 0.218 m³\\n\\nAffichage: 0.218 m³ emballés"}, {"label": "fauteuil", "notes": "Fauteuils beiges/gris", "fragile": false, "category": "furniture", "quantity": 2, "stackable": false, "volume_m3": 0.441, "confidence": 0.9, "dismountable": false, "dimensions_cm": {"width": 70, "height": 90, "length": 70, "source": "estimated"}, "is_small_object": false, "textile_included": false, "packaging_display": "0.463 M³ emballés", "packaged_volume_m3": 0.46305, "dismountable_source": "database", "dismountable_confidence": 0.3, "packaging_calculation_details": "📏 DIMENSIONS\\n70×70×90cm (max: 90cm)\\n\\n🔧 RÈGLE TYPE D'OBJET\\nMeuble non fragile → Volume + 5%\\n\\n📦 RÈGLE DU CARTON\\nDimension max: 90cm\\nCarton max: 50cm\\nRésultat: ✗ Trop grand pour carton\\n\\n📊 DIMENSION EMBALLÉE\\nVolume original: 0.441 m³\\nVolume emballé: 0.463 m³\\n\\nAffichage: 0.463 m³ emballés"}], "errors": [], "totals": {"volume_m3": 7.189, "count_items": 15}, "version": "1.0.0", "photo_id": "ac8cd64a-4d25-42a2-9a37-7fbffcad2ec3,1ce891c6-fb6b-44e9-8a15-3967f5e0b967,6ebbef63-2b0b-417f-b0e1-d3f7aa222102,c91aeac6-9225-4aa6-9cde-b99800ce55a1", "roomType": "salon", "warnings": [], "photoCount": 4, "analysisType": "room-based-claude", "special_rules": {"autres_objets": {"present": true, "volume_m3": 0.2, "listed_items": ["livres", "objets décoratifs", "lampe"]}}, "_groupPhotoIds": ["ac8cd64a-4d25-42a2-9a37-7fbffcad2ec3", "6ebbef63-2b0b-417f-b0e1-d3f7aa222102", "1ce891c6-fb6b-44e9-8a15-3967f5e0b967", "c91aeac6-9225-4aa6-9cde-b99800ce55a1"], "_analysisVersion": 1, "_isGroupAnalysis": true}	2025-10-13 01:57:56.041	\N	\N	\N	PENDING	2025-10-13 01:58:26.099	\N	\N
\.


--
-- Data for Name: Project; Type: TABLE DATA; Schema: public; Owner: guillaumestehelin
--

COPY public."Project" (id, name, "userId", "customerName", "customerEmail", "customerPhone", "customerAddress", "moveDate", "currentStep", "createdAt", "updatedAt") FROM stdin;
a0b99114-ad22-45f8-ae34-4e3864d9796f	Projet Moverz	temp-ece35736-9e2d-4365-ac8b-5245c8894a17	\N	\N	\N	\N	\N	1	2025-10-13 01:29:15.775	2025-10-13 01:29:15.775
\.


--
-- Data for Name: Room; Type: TABLE DATA; Schema: public; Owner: guillaumestehelin
--

COPY public."Room" (id, name, "roomType", "userId", "createdAt", "updatedAt") FROM stdin;
8f625dd4-e2cf-429f-b705-cb801981ad55	Couloir	couloir	temp-ece35736-9e2d-4365-ac8b-5245c8894a17	2025-10-13 01:29:15.785	2025-10-13 01:57:56.336
a5cd1f35-8e0b-4749-b033-73e3a6f8ea5a	Salon	salon	temp-ece35736-9e2d-4365-ac8b-5245c8894a17	2025-10-13 01:29:15.825	2025-10-13 01:57:56.612
7821acde-41ec-4f8a-802e-ea9ddd4229db	Salle_a_manger	salle_a_manger	temp-ece35736-9e2d-4365-ac8b-5245c8894a17	2025-10-13 01:29:18.327	2025-10-13 01:57:58.617
69d784a4-9064-47c1-ae1b-73843076a022	Chambre	chambre	temp-ece35736-9e2d-4365-ac8b-5245c8894a17	2025-10-13 01:29:18.217	2025-10-13 01:57:58.692
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: guillaumestehelin
--

COPY public."User" (id, email, "createdAt", "updatedAt") FROM stdin;
temp-ece35736-9e2d-4365-ac8b-5245c8894a17	\N	2025-10-13 01:28:58.976	2025-10-13 01:28:58.976
\.


--
-- Data for Name: UserModification; Type: TABLE DATA; Schema: public; Owner: guillaumestehelin
--

COPY public."UserModification" (id, "userId", "photoId", "itemIndex", field, value, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: guillaumestehelin
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
7f096b0b-83b2-4624-bf3b-81f56358fd2a	30a85e4874840bfe6c181d052aa0786a07f9c079f12d1ab9768debba6ef59d37	2025-10-13 08:26:15.971646+07	20251008061154_init_postgres_from_sqlite	\N	\N	2025-10-13 08:26:15.943757+07	1
964e34eb-fb61-4289-adc1-ee4da73398dd	2edd151f8af860fe1f2cc963fe7611496e596a36d623b088225b4f9c358c0f61	2025-10-13 08:26:15.976791+07	20251008071731_add_ai_metrics_observability	\N	\N	2025-10-13 08:26:15.971989+07	1
63ecf970-e7fd-40eb-9bea-7ea8f1dc6b67	c7721d23321565c7dd1e5df76f28d7c761b67063abd135a4447cda89d20e5815	2025-10-13 08:26:15.985421+07	20251008074600_add_asset_job_s3_upload	\N	\N	2025-10-13 08:26:15.977109+07	1
a603a2a3-3d3c-4cb9-a833-8e4d2b085cec	4e82935c86586e5e42c5fc4bbec930c85d4e1610cf6a14e9f677079b9c8b0cc8	2025-10-13 08:26:15.987392+07	20251008082722_lot10_add_photo_analysis_fields	\N	\N	2025-10-13 08:26:15.985887+07	1
59bf5673-9c9f-4d61-9364-4d2b97ec2f97	58b0ed074f70e50f04cbfe7dd086aa252bf8c4b02f53232bda8932cd737ba155	2025-10-13 08:26:15.99263+07	20251008084103_lot11_add_batch_orchestration	\N	\N	2025-10-13 08:26:15.987693+07	1
\.


--
-- Name: AiMetric AiMetric_pkey; Type: CONSTRAINT; Schema: public; Owner: guillaumestehelin
--

ALTER TABLE ONLY public."AiMetric"
    ADD CONSTRAINT "AiMetric_pkey" PRIMARY KEY (id);


--
-- Name: AnalyticsEvent AnalyticsEvent_pkey; Type: CONSTRAINT; Schema: public; Owner: guillaumestehelin
--

ALTER TABLE ONLY public."AnalyticsEvent"
    ADD CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY (id);


--
-- Name: Asset Asset_pkey; Type: CONSTRAINT; Schema: public; Owner: guillaumestehelin
--

ALTER TABLE ONLY public."Asset"
    ADD CONSTRAINT "Asset_pkey" PRIMARY KEY (id);


--
-- Name: Batch Batch_pkey; Type: CONSTRAINT; Schema: public; Owner: guillaumestehelin
--

ALTER TABLE ONLY public."Batch"
    ADD CONSTRAINT "Batch_pkey" PRIMARY KEY (id);


--
-- Name: Job Job_pkey; Type: CONSTRAINT; Schema: public; Owner: guillaumestehelin
--

ALTER TABLE ONLY public."Job"
    ADD CONSTRAINT "Job_pkey" PRIMARY KEY (id);


--
-- Name: Photo Photo_pkey; Type: CONSTRAINT; Schema: public; Owner: guillaumestehelin
--

ALTER TABLE ONLY public."Photo"
    ADD CONSTRAINT "Photo_pkey" PRIMARY KEY (id);


--
-- Name: Project Project_pkey; Type: CONSTRAINT; Schema: public; Owner: guillaumestehelin
--

ALTER TABLE ONLY public."Project"
    ADD CONSTRAINT "Project_pkey" PRIMARY KEY (id);


--
-- Name: Room Room_pkey; Type: CONSTRAINT; Schema: public; Owner: guillaumestehelin
--

ALTER TABLE ONLY public."Room"
    ADD CONSTRAINT "Room_pkey" PRIMARY KEY (id);


--
-- Name: UserModification UserModification_pkey; Type: CONSTRAINT; Schema: public; Owner: guillaumestehelin
--

ALTER TABLE ONLY public."UserModification"
    ADD CONSTRAINT "UserModification_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: guillaumestehelin
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: guillaumestehelin
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: AiMetric_operation_idx; Type: INDEX; Schema: public; Owner: guillaumestehelin
--

CREATE INDEX "AiMetric_operation_idx" ON public."AiMetric" USING btree (operation);


--
-- Name: AiMetric_provider_model_idx; Type: INDEX; Schema: public; Owner: guillaumestehelin
--

CREATE INDEX "AiMetric_provider_model_idx" ON public."AiMetric" USING btree (provider, model);


--
-- Name: AiMetric_success_idx; Type: INDEX; Schema: public; Owner: guillaumestehelin
--

CREATE INDEX "AiMetric_success_idx" ON public."AiMetric" USING btree (success);


--
-- Name: AiMetric_ts_idx; Type: INDEX; Schema: public; Owner: guillaumestehelin
--

CREATE INDEX "AiMetric_ts_idx" ON public."AiMetric" USING btree (ts);


--
-- Name: Asset_createdAt_idx; Type: INDEX; Schema: public; Owner: guillaumestehelin
--

CREATE INDEX "Asset_createdAt_idx" ON public."Asset" USING btree ("createdAt");


--
-- Name: Asset_projectId_idx; Type: INDEX; Schema: public; Owner: guillaumestehelin
--

CREATE INDEX "Asset_projectId_idx" ON public."Asset" USING btree ("projectId");


--
-- Name: Asset_s3Key_key; Type: INDEX; Schema: public; Owner: guillaumestehelin
--

CREATE UNIQUE INDEX "Asset_s3Key_key" ON public."Asset" USING btree ("s3Key");


--
-- Name: Asset_status_idx; Type: INDEX; Schema: public; Owner: guillaumestehelin
--

CREATE INDEX "Asset_status_idx" ON public."Asset" USING btree (status);


--
-- Name: Asset_userId_idx; Type: INDEX; Schema: public; Owner: guillaumestehelin
--

CREATE INDEX "Asset_userId_idx" ON public."Asset" USING btree ("userId");


--
-- Name: Batch_projectId_idx; Type: INDEX; Schema: public; Owner: guillaumestehelin
--

CREATE INDEX "Batch_projectId_idx" ON public."Batch" USING btree ("projectId");


--
-- Name: Batch_status_idx; Type: INDEX; Schema: public; Owner: guillaumestehelin
--

CREATE INDEX "Batch_status_idx" ON public."Batch" USING btree (status);


--
-- Name: Batch_userId_idx; Type: INDEX; Schema: public; Owner: guillaumestehelin
--

CREATE INDEX "Batch_userId_idx" ON public."Batch" USING btree ("userId");


--
-- Name: Job_createdAt_idx; Type: INDEX; Schema: public; Owner: guillaumestehelin
--

CREATE INDEX "Job_createdAt_idx" ON public."Job" USING btree ("createdAt");


--
-- Name: Job_status_idx; Type: INDEX; Schema: public; Owner: guillaumestehelin
--

CREATE INDEX "Job_status_idx" ON public."Job" USING btree (status);


--
-- Name: Job_type_idx; Type: INDEX; Schema: public; Owner: guillaumestehelin
--

CREATE INDEX "Job_type_idx" ON public."Job" USING btree (type);


--
-- Name: Job_userId_idx; Type: INDEX; Schema: public; Owner: guillaumestehelin
--

CREATE INDEX "Job_userId_idx" ON public."Job" USING btree ("userId");


--
-- Name: Photo_batchId_idx; Type: INDEX; Schema: public; Owner: guillaumestehelin
--

CREATE INDEX "Photo_batchId_idx" ON public."Photo" USING btree ("batchId");


--
-- Name: Photo_projectId_idx; Type: INDEX; Schema: public; Owner: guillaumestehelin
--

CREATE INDEX "Photo_projectId_idx" ON public."Photo" USING btree ("projectId");


--
-- Name: Photo_status_idx; Type: INDEX; Schema: public; Owner: guillaumestehelin
--

CREATE INDEX "Photo_status_idx" ON public."Photo" USING btree (status);


--
-- Name: Project_userId_idx; Type: INDEX; Schema: public; Owner: guillaumestehelin
--

CREATE INDEX "Project_userId_idx" ON public."Project" USING btree ("userId");


--
-- Name: Project_userId_name_key; Type: INDEX; Schema: public; Owner: guillaumestehelin
--

CREATE UNIQUE INDEX "Project_userId_name_key" ON public."Project" USING btree ("userId", name);


--
-- Name: Room_userId_idx; Type: INDEX; Schema: public; Owner: guillaumestehelin
--

CREATE INDEX "Room_userId_idx" ON public."Room" USING btree ("userId");


--
-- Name: Room_userId_roomType_key; Type: INDEX; Schema: public; Owner: guillaumestehelin
--

CREATE UNIQUE INDEX "Room_userId_roomType_key" ON public."Room" USING btree ("userId", "roomType");


--
-- Name: UserModification_photoId_idx; Type: INDEX; Schema: public; Owner: guillaumestehelin
--

CREATE INDEX "UserModification_photoId_idx" ON public."UserModification" USING btree ("photoId");


--
-- Name: UserModification_userId_idx; Type: INDEX; Schema: public; Owner: guillaumestehelin
--

CREATE INDEX "UserModification_userId_idx" ON public."UserModification" USING btree ("userId");


--
-- Name: UserModification_userId_photoId_itemIndex_field_key; Type: INDEX; Schema: public; Owner: guillaumestehelin
--

CREATE UNIQUE INDEX "UserModification_userId_photoId_itemIndex_field_key" ON public."UserModification" USING btree ("userId", "photoId", "itemIndex", field);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: guillaumestehelin
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: idx_analytics_created_at; Type: INDEX; Schema: public; Owner: guillaumestehelin
--

CREATE INDEX idx_analytics_created_at ON public."AnalyticsEvent" USING btree ("createdAt");


--
-- Name: idx_analytics_event_type; Type: INDEX; Schema: public; Owner: guillaumestehelin
--

CREATE INDEX idx_analytics_event_type ON public."AnalyticsEvent" USING btree ("eventType");


--
-- Name: idx_analytics_user_id; Type: INDEX; Schema: public; Owner: guillaumestehelin
--

CREATE INDEX idx_analytics_user_id ON public."AnalyticsEvent" USING btree ("userId");


--
-- Name: Batch Batch_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: guillaumestehelin
--

ALTER TABLE ONLY public."Batch"
    ADD CONSTRAINT "Batch_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Photo Photo_batchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: guillaumestehelin
--

ALTER TABLE ONLY public."Photo"
    ADD CONSTRAINT "Photo_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES public."Batch"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Photo Photo_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: guillaumestehelin
--

ALTER TABLE ONLY public."Photo"
    ADD CONSTRAINT "Photo_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Project Project_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: guillaumestehelin
--

ALTER TABLE ONLY public."Project"
    ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Room Room_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: guillaumestehelin
--

ALTER TABLE ONLY public."Room"
    ADD CONSTRAINT "Room_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserModification UserModification_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: guillaumestehelin
--

ALTER TABLE ONLY public."UserModification"
    ADD CONSTRAINT "UserModification_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict aVcDZOyLedqYk31zAbheJt1qvrncOLhWo9PYO1yizG6dh00cRRkgCxlTpaOazd0

