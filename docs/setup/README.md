# Configurar el servidor

## Desplegament per a desenvolupament
Si la nostra màquina és per a desenvolupar l'aplicació el més senzill és crear un entorn amb Vagrant i **Homestead**. En la [documentació de Laravel](https://laravel.com/docs/5.6/homestead) hi ha informació de còm crear i configurar eixe entorn.

## Desplegament per a producció
Si només volem tindre l'aplicació funcionant necessitem un servidor on instal·larem:
* **apache2**
* **mysql-server** o **mariadb-server** (recorda que després hem d'executar el comando **`mysql_secure_installation`** que configura l'usuari root). NOTA: ara la validació dels usuaris la fa el sistema (el _plugin_ 'auth_socket' o 'unix_socket'). Per a configurar un usuari amb privilegis consulta [StackOverflow](https://stackoverflow.com/questions/39281594/error-1698-28000-access-denied-for-user-rootlocalhost) o qualsevol altra pàgina en internet. En resum, executem:
```bash
sudo mysql -u root

mysql> USE mysql;
mysql> SELECT User, Host, plugin, authentication_string FROM mysql.user;
### Si uso Mysql le cambio el plugin y le pongo una contraseña
mysql> ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'P@ssw0rd';
### Si uso MariaDB le cambio el password al usuario
mysql> UPDATE user SET password=PASSWORD('your_p@ssw0rd') WHERE User='root';
mysql> UPDATE user SET plugin='auth_socket' WHERE User='root';
### en ambos casos
mysql> FLUSH PRIVILEGES;
mysql> exit;

sudo systemctl restart mysql.service    # o mariadb.service
```
Fuente correcta para mysql:[How To Install MySQL on Ubuntu 18.04](https://www.digitalocean.com/community/tutorials/how-to-install-mysql-on-ubuntu-18-04#step-2-%E2%80%94-configuring-mysql)

> Altra alternativa és instal·lar una versió més recent desde els repositoris, consulta [MariaDB Downloads](https://downloads.mariadb.org/mariadb/repositories/#mirror=tedeco&distro=Ubuntu&distro_release=bionic--ubuntu_bionic&version=10.3), o més senzill encara, tras instal·lar _phpmyadmin_ donem permisos a l'usuari phpmyadmin i utilitzem eixe usuari:
```bash
sudo mysql -u root

mysql> USE mysql;
mysql> GRANT ALL PRIVILEGES ON *.* TO 'phpmyadmin'@'localhost';
mysql> FLUSH PRIVILEGES;
mysql> exit;

sudo systemctl restart mysql.service
```

* **php**
* **phpmyadmin** (abans hem d'haver configurat el mysql)
* **git**
* **composer**

### Configurar apache
Creem els certificats (el _.key_ en /etc/ssl/private i els altres 2 en en /etc/ssl/certs):
```bash
openssl genrsa -out intranet.key 1024
openssl req -new -key intranet.key -out intranet.csr   # completem la informació que ens demanen
openssl x509 -req -in intranet.csr -signkey intranet.key -out intranet.crt
```

Posem en /etc/hosts el nom de la màquina (p.ej. `intranet.my`).

Configurem el lloc web SSL en _/etc/apache2/sites-available_:
* ServerName: p.ej. `ServerName intranet.my`
* DocumentRoot: `DocumentRoot /var/www/html/intranetBatoi/public`
* SSLCertificateFile: `SSLCertificateFile /etc/ssl/certs/intranet.crt`
* SSLCertificateKeyFile: `SSLCertificateKeyFile /etc/ssl/certs/intranet.key`
* Creem un nou directori:`
```bash
<Directory /var/www/html/intranetBatoi/public>
  AllowOverride All
  Order Allow,Deny
  Allow from All
</Directory>
```

Configurem el lloc web no SSL en _/etc/apache2/sites-available_ per a que redireccione al SSL:
* ServerName: p.ej. `ServerName intranet.my`
* Redireccionem: `Redirect permanent  /  https://intranet.my/`
* DocumentRoot: `DocumentRoot /var/www/html/intranetBatoi/public`

Habilitem els sites si els hem creat nous:
```bash
sudo a2ensite intranet.conf
sudo a2ensite intranet-ssl.conf
```

Configurem el **php.ini** (en _/etc/php/7.x/apache2/_) per a poder subir els fitxers de Itaca que són molt grans. També és convenient indicar la hora local:
```bash
post_max_size=0
upload_max_filesize = 200M
date.timezone = Europe/Madrid
```

Posem el nostre domini en el **/etc/hosts**:
```bash
127.0.0.1   intranet.my
```

Per a finalitzar hem d'activar (si no ho estan ja) els mòduls **ssl** i **rewrite** i reiniciar apache:
```bash
sudo a2enmod ssl
sudo a2enmod rewrite
sudo systemctl restart apache2.service
```
ATENCIÓ: cal que estiga la carpeta intranetBatoi ja creada abans de reiniciar Apache per que no done un error.

## Descàrrega de l'aplicació
A l'hora de descarregar el codi, creem la carpeta que vaja a contenir el nostre codi i anem a ella:
```bash
mkdir ~/code/borsaBatoi
cd ~/code/borsaBatoi
```

Inicialitzem git i descarregem l'aplicació:
```bash
git init
git remote add origin https://github.com/cipfpbatoi/borsaBatoi.git
git pull origin master
```

Des de **dins de la màquina Homestead** instal·lem les llibreries necessàries (això tardarà prou perquè ha de baixar-se moltes llibreries de Internet):
```bash
composer update
npm install
```
i copiem el fitxer **.env** que no es descarrega de git. Allí hem de configurar:
- APP_NAME: Ponemos nuestro nombre (CIP FP Batoi)
- l'accés a la BBDD (DB_DATABASE, DB_USERNAME, DB_PASSWORD)
- el mail: MAIL_DRIVER (sendmail), MAIL_HOST (localhost), MAIL_PORT (25), MAIL_USERNAME (usuario del sistema que envía los e-mails), MAIL_PASSWORD (su contrasenña), MAIL_ ENCRYPTION (null), MAIL_FROM_ADDRESS (borsatreball@cipfpbatoi.es), MAIL_FROM_NAME ("Borsa Treball Batoi")
- 

Creem la BBDD `borsatreball` i executem la migración:
```bash
php artisan migrate
php artisan db:seed
```

Hem de donar permisos d'escriptura a l'usuari www-data sobre la carpeta storage i el seu contingut.

Per a l'autenticació hdem d'instal·lar [laravel/passport](https://laravel.com/docs/5.8/passport). A continuació executem el comando `passport:install` que crea las claus d'encriptació que s'utilitzen per a generar els tokens. A més crea els clients "personal access" i "password grant" clients which will be used to generate access tokens):
```bash
php artisan passport:install
```

## Configurar el mail
Nosaltres hem instal·lat **`postmail`** i hem creat en el sistema l'usuari `usrmail` per a enviar els correus. EN el **`.env`** configurem:
```bash
MAIL_DRIVER=sendmail
MAIL_HOST=localhost
MAIL_PORT=25
MAIL_USERNAME=usrmail
MAIL_PASSWORD=P@ssW0rd
MAIL_ENCRYPTION=null
MAIL_FROM_NAME="Borsa Treball Batoi"
MAIL_FROM_ADDRESS=borsa@nosaltres.com
```

Permisos de www-data a storage. Configurar mail en .env

## Cosas raras
1. Cada vez que te cargas la bbd hay que ejecutar `php artisan passport:client --personal`
