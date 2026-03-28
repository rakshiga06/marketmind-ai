from confluent_kafka import Producer
from config import config
import logging

logger = logging.getLogger(__name__)

class KafkaProducerClient:
    def __init__(self):
        try:
            self.producer = Producer({'bootstrap.servers': config.KAFKA_BOOTSTRAP_SERVERS})
        except Exception as e:
            logger.error(f"Failed to initialize Kafka producer: {e}")
            self.producer = None

    def produce(self, topic: str, value: str):
        if not self.producer:
            return
        self.producer.produce(topic, value.encode('utf-8'))
        self.producer.flush()
