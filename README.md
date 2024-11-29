## Installation
B1: 
- cài nodejs: https://nodejs.org/en 

B2: Config variable environment cho nodejs

B3: Mở terminal trong thư mục sm và thực hiện:
### npm install 

B4: 
- Cài đặt DBeaver: https://dbeaver.io/

B5: 
- Cài docker: https://www.docker.com/

B5: Config variable environment cho docker

## Usage
Mở DBeaver và migration cho DB từ file importDB.sql

Nếu chạy trên môi trường development:

B1: config .env trong thư mục sm:
- NODE_ENV=development
- HOST_NAME= localhost 

B2: Mở terminal tại thư mục sm và thực hiện: (địa chỉ http://localhost:8080/)
### npm run dev 


Nếu chạy trên môi trường production:

B1: config .env trong thư mục sm:
- NODE_ENV=production
- HOST_NAME= 0.0.0.0 

B2: Mở cmd tại thư mục docker và thực hiện:
### docker compose -p smartunlock up -d (--build  #nếu muốn build lại + xoá cache)


## Contributing

Nhóm BTL 4 - IOT (Phương Nam - Tiến Duy - Văn Nam)


## License

[MIT](https://www.facebook.com/vietvu.nam.vn/)
