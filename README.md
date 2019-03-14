# borsaBatoi
Borsa de treball del CIP FP Batoi

## Despliegue en Homestead
Si la nostra màquina és per a desenvolupar l'aplicació el més senzill és crear un entorn amb Vagrant i Homestead. En la [documentació de Laravel](https://laravel.com/docs/5.6/homestead) hi ha informació de còm crear i configurar eixe entorn.

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
i copiem el fitxer **.env** que no es descarrega de git.

Creem la BBDD `borsatreball` i executem la migración:
```bash
php artisan migrate
php artisan db:seed
```

Instalar [laravel/passport](https://laravel.com/docs/5.8/passport) (Next, you should run the passport:install command. This command will create the encryption keys needed to generate secure access tokens. In addition, the command will create "personal access" and "password grant" clients which will be used to generate access tokens):
```bash
php artisan passport:install
```


