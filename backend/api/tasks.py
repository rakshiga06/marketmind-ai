from worker import celery_app
from ingestion.bse_scraper import BSEScraper
from services.rule_engine import evaluate_multi_signals, MarketSignal
from services.pinecone_service import store_alert_context
import json

@celery_app.task(name="run_market_correlator")
def run_market_correlator():
    scraper = BSEScraper()
    
    # 1. Fetch latest bulk deals
    bulk_deals = scraper.get_bulk_deals()
    
    # 2. Fetch latest insider trades
    insider_trades = scraper.get_insider_trades()
    
    # Combine signals
    all_signals = bulk_deals + insider_trades
    
    # 3. Run rule engine
    alerts = evaluate_multi_signals(all_signals, window_days=5)
    
    if alerts:
        for alert in alerts:
            # Generate representation
            rep_text = f"Alert for {alert['symbol']} with score {alert['total_score']}. {alert['summary']}"
            
            # Store in Pinecone for Context Enrichment
            store_alert_context(
                alert_id=f"alert_{alert['symbol']}_{alert['trigger_date']}",
                text_representation=rep_text,
                metadata={"symbol": alert['symbol'], "score": alert['total_score']}
            )
            print(f"[CELERY WORKER ALERT] Triggered: {alert['symbol']} (Score: {alert['total_score']}) -> {alert['summary']}")
            
    return len(alerts)

# Add periodic schedule
@celery_app.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    # Execute the correlator every 60 seconds for demonstration purposes
    sender.add_periodic_task(60.0, run_market_correlator.s(), name='run correlator every minute')
