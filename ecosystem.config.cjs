module.exports = {
  apps: [
    {
      name: 'myapp-queue',
      script: 'artisan',
      interpreter: 'php',
      args: 'queue:work --tries=3 --timeout=90',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
    },
    {
      name: 'myapp-schedule',
      script: 'artisan',
      interpreter: 'php',
      args: 'schedule:work',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
    },
    {
      name: 'myapp-reverb',
      script: 'artisan',
      interpreter: 'php',
      args: 'reverb:start --host=0.0.0.0 --port=8080',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
    }
  ]
};
