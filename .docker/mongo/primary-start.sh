#!/bin/sh
set -e

echo "🔧 Starting MongoDB Primary..."

# Create directory for keyfile
mkdir -p /keyfile-source

# Create keyfile in shared volume if it doesn't exist
if [ ! -f /keyfile-source/mongodb-keyfile ]; then
  echo "📄 Creating keyfile in shared volume..."
  openssl rand -base64 756 > /keyfile-source/mongodb-keyfile
  chmod 400 /keyfile-source/mongodb-keyfile
  chown mongodb:mongodb /keyfile-source/mongodb-keyfile
  echo "✅ Keyfile created in shared volume"
fi

# Copy to MongoDB location
echo "📋 Copying keyfile to /etc/mongo..."
mkdir -p /etc/mongo
cp /keyfile-source/mongodb-keyfile /etc/mongo/keyfile
chmod 400 /etc/mongo/keyfile
chown mongodb:mongodb /etc/mongo/keyfile

# Start MongoDB in standalone mode first
echo "🚀 Starting MongoDB temporarily without replicaset..."
mongod --bind_ip_all --fork --logpath /var/log/mongodb.log

# Wait for MongoDB to start
sleep 5

# Create admin user
echo "👤 Creating admin user..."
mongosh --eval "
  try {
    db.getSiblingDB('admin').createUser({
      user: 'admin',
      pwd: '${MONGO_ADMIN_PASSWORD:-admin123}',
      roles: [
        { role: 'root', db: 'admin' },
        { role: 'clusterAdmin', db: 'admin' }
      ]
    });
    print('✅ Admin user created successfully');
  } catch(e) {
    print('⚠️ Error creating user:', e.message);
  }
"

# Stop MongoDB
mongod --shutdown

# Start MongoDB with replicaset
echo "🚀 Starting MongoDB with replicaset..."
exec mongod --bind_ip_all --replSet rs0 --keyFile /etc/mongo/keyfile --auth