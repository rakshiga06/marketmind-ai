-- Extension needed for TimescaleDB
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Assumes the physical tables are already created by SQLAlchemy Base.metadata.create_all()
-- Here we convert the ohlcv table to a hypertable
SELECT create_hypertable('ohlcv', 'time', if_not_exists => TRUE);

-- Example continuous aggregate rollup (to be implemented as needed)
-- CREATE MATERIALIZED VIEW ohlcv_daily
-- WITH (timescaledb.continuous) AS
-- SELECT
--     time_bucket('1 day', time) AS bucket,
--     symbol,
--     first(open, time) AS open,
--     max(high) AS high,
--     min(low) AS low,
--     last(close, time) AS close,
--     sum(volume) AS volume
-- FROM ohlcv
-- GROUP BY bucket, symbol;
