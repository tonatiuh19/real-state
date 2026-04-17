-- Migration: Reassign imported realtor partners from broker_id=1 to Daniel Carrillo
-- Context: The 20260409_010000_import_realtor_partners.sql migration set created_by_broker_id=1
--          (Alex Gomez), but all those partners should belong to Daniel Carrillo.
-- Safe to re-run: UPDATE is idempotent once Daniel Carrillo's ID is resolved.

SET @daniel_id = (
  SELECT id
  FROM brokers
  WHERE tenant_id = 1
    AND first_name = 'Daniel'
    AND last_name  = 'Carrillo'
    AND role       = 'admin'
    AND status     = 'active'
  LIMIT 1
);

-- Abort with a clear error if Daniel Carrillo is not found
SELECT IF(
  @daniel_id IS NULL,
  (SELECT 1 FROM information_schema.tables WHERE 1/0),  -- forces divide-by-zero error
  @daniel_id
) AS daniel_id_check;

-- Reassign only the partners imported by the 20260409 migration
-- (identified by their exact email list) that still point to broker id=1.
UPDATE brokers
SET
  created_by_broker_id = @daniel_id,
  updated_at           = NOW()
WHERE tenant_id = 1
  AND role      = 'broker'
  AND created_by_broker_id = 1
  AND email IN (
    'christina@ambiancela.com',
    'sherryjosephrealty@gmail.com',
    'duranmich27@gmail.com',
    'm.mendezsellshomes@gmail.com',
    'donnafarley1@hotmail.com',
    'adriana@modeestatesgroup.com',
    'bacosta21@yahoo.com',
    'amy@amykong.com',
    'olgaumana719@gmail.com',
    'karinaramoshomes@gmail.com',
    'jessica.nexthomegrandview@gmail.com',
    'melani@espinozaestates.com',
    'dalia.rhule@gmail.com',
    'elibeth772@aol.com',
    'mrstaurus2@yahoo.com',
    'brokerchristina@gmail.com',
    'krismassarorealestate@gmail.com',
    'lizgarciare@outlook.com',
    'vhayes.realestate@gmail.com',
    'juliayire@gmail.com',
    'dalilahdiazrealtor@gmail.com',
    'azubca@gmail.com',
    'jasminlovett@yahoo.com',
    'homesbymariacuadros@gmail.com',
    'lluvia@sunnynaranggroup.com',
    'saraq@saraqrealty.com',
    'yourbrokernikki@gmail.com',
    'mariaalasacv@gmail.com',
    'reneandrearealty@gmail.com',
    'homesbytashi@gmail.com',
    'christinahernandezc21@gmail.com',
    'jp.pena@compass.com',
    'beberly.realestate@gmail.com',
    'teresa1990@gmail.com',
    'jaquelineperez.realty@gmail.com',
    'realestate.lizlarios@gmail.com',
    'abel.vivas@compass.com',
    'rochellegsellshomes@gmail.com',
    'liu6266625800@gmail.com',
    'roxanne.zheng@yahoo.com',
    'esmeralda@nvccorp.com',
    'crystalt1285@gmail.com',
    'lorifennrealtor@gmail.com',
    'realestate@carloshq.com',
    'tanyastarcevich@gmail.com',
    'vmrobles@aol.com',
    'kathyshasha@gmail.com',
    'cathyleenass@gmail.com',
    'patriciasylican@gmail.com',
    'luqmankarim@kw.com',
    'homesbytf@gmail.com',
    'bmperez23@gmail.com',
    'soldbysoniasanchez@gmail.com',
    'gisellefernandez@yahoo.com',
    'carlabravo1432@gmail.com',
    'mecervantes562@yahoo.com',
    'allyah.realty@gmail.com',
    'sellwithcindyu@gmail.com',
    'gonzales1linda@gmail.com',
    'rosiegarciateam@gmail.com',
    'barbie@laliveproperties.com',
    'alexleonft@gmail.com',
    'octeamtc@gmail.com',
    'jcolon@colonrealty.com',
    'lauravazquezrealtor@gmail.com',
    'tgalahomes@gmail.com',
    'denicemparga@gmail.com',
    'realtor.iveth@yahoo.com',
    'aaamorales9@gmail.com',
    'homesbyflor15@gmail.com',
    'christie.ladia@exprealty.com',
    'rosalvarcanseco@gmail.com',
    'lorenacanhelp@gmail.com',
    'homesbymaryrobles@gmail.com',
    'rosie.soltero@hotmail.com',
    'hans@hanschalco.com',
    'jdavalos@colonrealty.com'
  );

-- Confirmation summary
SELECT
  CONCAT('Reassigned ', ROW_COUNT(), ' partner(s) to Daniel Carrillo (id=', IFNULL(@daniel_id, 'NOT FOUND'), ')') AS result;
