**Mini Proyecto: Arquitectura monolítica y microservicios**  
Autor: Luis Alberto Tecsi Huallpa  
Complete las guias en entorno linux deb nativo (bodhi)  
API REST de Usuarios, Productos y Pedidos construida con Node.js, Express y  
   
 PostgreSQL, probada con Jest + Supertest y ejecutada con Docker Compose.  
**Ejecutar con Docker**  
cd monolito  
 docker compose up --build -d  
 curl http://localhost:3000/usuarios  
 docker compose exec app npm test  
   
Para recrear la base desde init.sql: docker compose down -v.  
**Ejecutar en local**  
cd monolito  
 cp .env.example .env  
 npm install  
 npm start  
 npm test  
   
**Endpoints**  
| | | |  
|-|-|-|  
| **Método** | **Ruta** | **Descripción** |   
| GET | /health | Estado del servicio |   
| GET | /db-test | Prueba de conexión a PostgreSQL |   
| GET | /usuarios | Lista de usuarios |   
| GET | /productos | Lista de productos |   
| GET | /pedidos | Lista de pedidos |   
   
**Microservicios**  
La versión dividida en Usuarios (3001), Productos (3002) y Pedidos (3003), cada  
   
 uno con su propia base de datos, está en [microservicios/.](microservicios/README.md "microservicios/README.md")  
