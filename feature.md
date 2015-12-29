1. cache 支持内存/redis/文件，`put (key, value, ttl)` `get (key, value, ttl)` `destory (key)` `stream`
   
2. ``` json
   cache options:
   {
     adapter: 'memory'
   }
   or
   {
     adapter: 'redis',
     config: {
       port: 6379,
       host: 'localhost',
       database: 2
     }
   }
   ```
   
3. ``` json
   route options
   {
     'get /cacheOneMinute': 60
   }
   ```
   
4. ​


1. 文件，将文件放入cache
2. 动态渲染，放入cache，会涉及到res的处理