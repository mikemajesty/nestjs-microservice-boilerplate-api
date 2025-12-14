#!/bin/sh
set -e

echo "⏳ Aguardando MongoDB ficar healthy..."
sleep 15

echo "🔧 Configurando ReplicaSet..."

for i in 1 2 3 4 5; do
  echo "Attempt $i/5..."
  
  echo "📡 Trying to connect to nestjs-microservice-primary:27017 with authentication..."
  
  CONNECTION_OUTPUT=$(mongosh --host nestjs-microservice-primary:27017 \
    --username admin \
    --password "${MONGO_ADMIN_PASSWORD:-admin123}" \
    --authenticationDatabase admin \
    --eval 'db.adminCommand("ping")' 2>&1)
  
  CONNECTION_EXIT_CODE=$?
  
  if [ $CONNECTION_EXIT_CODE -eq 0 ]; then
    echo "✅ Conectado ao MongoDB!"
    echo "📋 Resposta: $CONNECTION_OUTPUT"
    
    echo "⚙️ Configurando ReplicaSet..."
    
    REPLICA_OUTPUT=$(mongosh --host nestjs-microservice-primary:27017 \
      --username admin \
      --password "${MONGO_ADMIN_PASSWORD:-admin123}" \
      --authenticationDatabase admin \
      --eval "
      try {
        rs.status();
        print('✅ ReplicaSet already configured');
      } catch(e) {
        print('⚙️ Initializing ReplicaSet...');
        rs.initiate({
          _id: 'rs0',
          members: [
            {_id: 0, host: 'nestjs-microservice-primary:27017', priority: 3},
            {_id: 1, host: 'nestjs-microservice-secondary:27017', priority: 2},
            {_id: 2, host: 'nestjs-microservice-tertiary:27017', priority: 1}
          ]
        });
        
        print('⏳ Waiting for replica set to stabilize...');
        sleep(5000);
        
        print('📊 ReplicaSet status:');
        rs.status();
        print('✅ ReplicaSet configured!');
      }
    " 2>&1)
    
    REPLICA_EXIT_CODE=$?
    
    if [ $REPLICA_EXIT_CODE -eq 0 ]; then
      echo "✅ Configuration successful!"
      echo "📋 Output: $REPLICA_OUTPUT"
      echo "🎉 MongoDB ReplicaSet ready!"
      exit 0
    else
      echo "❌ Error configuring ReplicaSet!"
      echo "🔍 Details: $REPLICA_OUTPUT"
    fi
    
  else
    echo "⚠️ Failed with authentication!"
    echo "🔍 Error: $CONNECTION_OUTPUT"
    
    echo "📡 Trying to connect without authentication..."
    
    # Try without authentication (in case the user does not exist yet)
    NO_AUTH_OUTPUT=$(mongosh --host nestjs-microservice-primary:27017 \
      --eval 'db.adminCommand("ping")' 2>&1)
    
    NO_AUTH_EXIT_CODE=$?
    
    if [ $NO_AUTH_EXIT_CODE -eq 0 ]; then
      echo "✅ Connected without authentication!"
      echo "📋 Response: $NO_AUTH_OUTPUT"
      
      echo "⚙️ Configuring ReplicaSet without authentication..."
      
      NO_AUTH_REPLICA_OUTPUT=$(mongosh --host nestjs-microservice-primary:27017 \
        --eval "
        try {
          rs.status();
          print('✅ ReplicaSet already configured');
        } catch(e) {
          print('⚙️ Initializing ReplicaSet...');
          rs.initiate({
            _id: 'rs0',
            members: [
              {_id: 0, host: 'nestjs-microservice-primary:27017', priority: 3},
              {_id: 1, host: 'nestjs-microservice-secondary:27017', priority: 2},
              {_id: 2, host: 'nestjs-microservice-tertiary:27017', priority: 1}
            ]
          });
          
          print('⏳ Waiting for replica set to stabilize...');
          sleep(5000);
          
          print('👤 Creating admin user...');
          db.getSiblingDB('admin').createUser({
            user: 'admin',
            pwd: '${MONGO_ADMIN_PASSWORD:-admin123}',
            roles: [
              { role: 'root', db: 'admin' },
              { role: 'clusterAdmin', db: 'admin' }
            ]
          });
          
          print('📊 Status of ReplicaSet:');
          rs.status();
          print('✅ ReplicaSet configured and user created!');
        }
      " 2>&1)
      
      NO_AUTH_REPLICA_EXIT_CODE=$?
      
      if [ $NO_AUTH_REPLICA_EXIT_CODE -eq 0 ]; then
        echo "✅ Configuration successful without authentication!"
        echo "📋 Output: $NO_AUTH_REPLICA_OUTPUT"
        echo "🎉 MongoDB ReplicaSet ready!"
      else
        echo "❌ Error configuring ReplicaSet without authentication!"
        echo "🔍 Details: $NO_AUTH_REPLICA_OUTPUT"
      fi
    else
      echo "❌ Failed without authentication as well!"
      echo "🔍 Error: $NO_AUTH_OUTPUT"
    fi
    
    echo "⚠️ Waiting 5s before the next attempt..."
    sleep 5
  fi
done

echo "❌ Could not configure ReplicaSet after 5 attempts"
echo "🔧 Diagnosing issues..."

# Diagnostic attempts
echo "1. Testing DNS resolution..."
docker exec mongo-init-replica nslookup nestjs-microservice-primary || echo "❌ nslookup failed"

echo "2. Testing connectivity..."
docker exec mongo-init-replica ping -c 2 nestjs-microservice-primary || echo "❌ ping failed"

echo "3. Checking primary logs..."
docker logs --tail 5 nestjs-microservice-primary

echo "4. Checking if MongoDB is running..."
docker exec nestjs-microservice-primary ps aux | grep mongod || echo "❌ MongoDB is not running"
echo "💡 Possible solutions:"
echo "   - Check if the containers are on the same network"
echo "   - Check if the primary is healthy"
echo "   - Check if the admin user exists and the password is correct"