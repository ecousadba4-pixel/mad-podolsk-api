--
-- PostgreSQL database dump
--

\restrict HGWTRPqWYgUeH6jsqj45TTSIagBeiYElkZLboM1PIc0EJkIkl4ZzR01FyQEDg9p

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
-- Name: contract_amount_2025; Type: TABLE; Schema: public; Owner: dima_admin
--

CREATE TABLE public.contract_amount_2025 (
    contract_amount numeric(14,2) CONSTRAINT podolsk_mad_2025_contract_amount_contract_amount_not_null NOT NULL
);


ALTER TABLE public.contract_amount_2025 OWNER TO dima_admin;

--
-- Name: TABLE contract_amount_2025; Type: COMMENT; Schema: public; Owner: dima_admin
--

COMMENT ON TABLE public.contract_amount_2025 IS 'the total amount of the contract for 2025';


--
-- Name: TABLE contract_amount_2025; Type: ACL; Schema: public; Owner: dima_admin
--

GRANT ALL ON TABLE public.contract_amount_2025 TO app_mad_podolsk;
GRANT SELECT ON TABLE public.contract_amount_2025 TO app_turnover_u4s;
GRANT SELECT ON TABLE public.contract_amount_2025 TO metabase;


--
-- PostgreSQL database dump complete
--

\unrestrict HGWTRPqWYgUeH6jsqj45TTSIagBeiYElkZLboM1PIc0EJkIkl4ZzR01FyQEDg9p

