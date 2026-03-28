from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Index, BigInteger
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class Company(Base):
    __tablename__ = 'companies'

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    isin = Column(String, unique=True, index=True)
    industry = Column(String)

class OHLCV(Base):
    """
    Time-series model meant to be a TimescaleDB hypertable.
    """
    __tablename__ = 'ohlcv'

    # TimescaleDB hypertables don't normally use a single primary key if it's partitioned by time
    time = Column(DateTime(timezone=True), primary_key=True, nullable=False)
    symbol = Column(String, primary_key=True, nullable=False)
    
    open = Column(Float, nullable=False)
    high = Column(Float, nullable=False)
    low = Column(Float, nullable=False)
    close = Column(Float, nullable=False)
    volume = Column(BigInteger, nullable=False)

    __table_args__ = (
        Index('ix_ohlcv_symbol_time', 'symbol', 'time'),
    )

class CorporateFiling(Base):
    __tablename__ = 'corporate_filings'

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, index=True, nullable=False)
    filing_date = Column(DateTime(timezone=True), nullable=False)
    title = Column(String, nullable=False)
    description = Column(String)
    url = Column(String)
