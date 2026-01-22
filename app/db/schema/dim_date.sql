--
-- PostgreSQL database dump
--

\restrict Cs1ORO0eBUd5DpYYpZwdRHj9D7diORmcZc0Mw4bOmsXQ3ZsYZiLZowUjLaXQzNa

-- Dumped from database version 18.1 (Ubuntu 18.1-1.pgdg24.04+2)
-- Dumped by pg_dump version 18.1 (Ubuntu 18.1-1.pgdg24.04+2)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: dim_date; Type: TABLE; Schema: public; Owner: dima_admin
--

CREATE TABLE public.dim_date (
    date_day date CONSTRAINT dates_table_date_not_null NOT NULL,
    month_name text,
    month_number integer,
    year integer,
    day_of_week integer,
    is_weekend boolean,
    year_month_key text,
    month_name_short text
);


ALTER TABLE public.dim_date OWNER TO dima_admin;

--
-- Name: dim_date dates_table_pkey; Type: CONSTRAINT; Schema: public; Owner: dima_admin
--

ALTER TABLE ONLY public.dim_date
    ADD CONSTRAINT dates_table_pkey PRIMARY KEY (date_day);


--
-- Name: TABLE dim_date; Type: ACL; Schema: public; Owner: dima_admin
--

GRANT SELECT ON TABLE public.dim_date TO app_turnover_u4s;
GRANT ALL ON TABLE public.dim_date TO app_mad_podolsk;
GRANT SELECT ON TABLE public.dim_date TO metabase;


--
-- PostgreSQL database dump complete
--

\unrestrict Cs1ORO0eBUd5DpYYpZwdRHj9D7diORmcZc0Mw4bOmsXQ3ZsYZiLZowUjLaXQzNa

