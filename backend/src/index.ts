import app from './app';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';

async function main(): Promise<void> {
  // Conectar a la base de datos
  await connectDatabase();

  // Iniciar servidor
  const server = app.listen(env.PORT, () => {
    console.log(`
🚀 Servidor iniciado correctamente
📍 URL: http://localhost:${env.PORT}
🔧 Entorno: ${env.NODE_ENV}
📊 Health check: http://localhost:${env.PORT}/api/health
    `);
  });

  // Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    console.log(`\n${signal} recibido. Cerrando servidor...`);

    server.close(async () => {
      await disconnectDatabase();
      console.log('👋 Servidor cerrado correctamente');
      process.exit(0);
    });

    // Forzar cierre después de 10 segundos
    setTimeout(() => {
      console.error('⚠️ Cierre forzado después de timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
