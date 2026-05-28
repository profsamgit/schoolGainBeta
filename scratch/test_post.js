

async function test() {
  const url = 'http://localhost:9002/api/hardware/bin-status';
  const payload = {
    terminalId: 'SG-HW-MAC-0A002700000D',
    levels: {
      plastico: 42,
      papel: 65,
      vidro: 12,
      metal: 88
    }
  };

  console.log('Sending test telemetry POST to:', url);
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer sg_hardware_secret_2026'
    },
    body: JSON.stringify(payload)
  });

  const text = await res.text();
  console.log('Response Status:', res.status);
  console.log('Response Body:', text);
}

test().catch(console.error);
