--
-- PostgreSQL database dump
--

\restrict 4QqVNWrQCY5h5K6fuVk7V3jmclhfqZTqQKhZaQjKye2Z77MCxqsn2yITo0alysf

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
-- Name: etl_load_state; Type: TABLE; Schema: public; Owner: dima_admin
--

CREATE TABLE public.etl_load_state (
    last_loaded_at timestamp without time zone
);


ALTER TABLE public.etl_load_state OWNER TO dima_admin;

--
-- Name: TABLE etl_load_state; Type: ACL; Schema: public; Owner: dima_admin
--

GRANT SELECT ON TABLE public.etl_load_state TO app_turnover_u4s;
GRANT ALL ON TABLE public.etl_load_state TO app_mad_podolsk;
GRANT SELECT ON TABLE public.etl_load_state TO metabase;


--
-- PostgreSQL database dump complete
--

\unrestrict 4QqVNWrQCY5h5K6fuVk7V3jmclhfqZTqQKhZaQjKye2Z77MCxqsn2yITo0alysf

