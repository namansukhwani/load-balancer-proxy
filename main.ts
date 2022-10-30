import { P2cBalancer } from 'load-balancers';
import http from 'http';
import httpProxy from 'http-proxy';
import { config } from 'dotenv';
config();

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Error', error);
});

process.on('uncaughtException', (error) => {
  console.error('Unhandled Exception', error);
});

function getProxies(): string[] {
  return process.env.PROXIES.split(',');
}

async function bootstrap() {
  console.log('Starting Proxy Server');
  const loadBalancingEnabled: boolean = process.env.LOAD_BALNCING === 'true';
  const proxies = getProxies();
  const loadBalancer = loadBalancingEnabled ? new P2cBalancer(proxies.length) : undefined;
  const proxy = httpProxy.createProxyServer();

  const server = http.createServer(function (req, res) {
    try {
      const target = loadBalancingEnabled ? proxies[loadBalancer.pick()] : proxies[0];
      proxy.web(req, res, { target, changeOrigin: true });
    } catch (error) {
      server.emit('error', error);
    }
  });
  const port = process.env.PORT || 3000;

  server.listen(port);

  server.on('request', (req, res) => {
    console.info(`${req.method} ${req.url} ${res.statusCode}`);
  });

  server.on('listening', () => {
    console.info('Proxy Server started on port :', port);
  });

  server.on('error', (err) => {
    console.error(err);
  });
}

bootstrap();
