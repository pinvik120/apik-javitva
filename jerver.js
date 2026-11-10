import express from 'express';
import mysql from 'mysql2';
import cors from cors;

import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const pool = mysql.createPool({
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
    port: process.env.DBPORT
});

app.get('/', (req, res) => {
    res.status(200).json({message: 'Elindult'});
});

app.get('/konyvek', (req, res) => {
    pool.query('SELECT * FROM `konyvek` ORDER BY id DESC;',
        (err, result) =>{

        if (err) res.status(500).json({hiba: err });

        res.status(200).json(result);
    })
    
} );

app.get('/konyvek/elerheto', (req, res) => {

    pool.query(
        `SELECT *
         FROM konyvek
         WHERE kolcsonozheto = 1
         AND kiadasi_ev < 2000`,
        (err, result) => {

            if (err) return res.status(500).json({ hiba: err });

            res.status(200).json(result);
        }
    );

});

app.get('/konyvek/kereses/:szoveg', (req, res) => {

    pool.query(
        `SELECT *
         FROM konyvek
         WHERE cim LIKE ?`,
        (err, result) => {

            if (err) return res.status(500).json({ hiba: err });

            res.status(200).json(result);
        }
    );

});

app.get('/mufajok/statisztika', (req, res) => {

    pool.query(
        `SELECT
            m.nev,
            COUNT(k.id) AS konyvek_szama
         FROM mufajok m
         LEFT JOIN konyvek k
         ON m.id = k.mufaj_id
         GROUP BY m.id, m.nev`,
        (err, result) => {

            if (err) return res.status(500).json({ hiba: err });

            res.status(200).json(result);
        }
    );

});

app.get('/konyvek/hosszuak', (req, res) => {
    pool.query('SELECT * FROM `konyvek` WHERE (konyvek.oldalszam < 600) ORDER BY id DESC;',
        (err, result) =>{

        if (err) res.status(500).json({hiba: err });

        res.status(200).json(result);
    })
    
} );

app.listen(PORT, () => {
    console.log(`server running on: http://localhost:${PORT}`);
});

const PORT = process.env.PORT || 8080;

app.post('/konyvek', (req, res) => {

    const { mufaj_id, cim, kiadasi_ev, oldalszam, kolcsonozheto } = req.body;

    pool.query(
        `INSERT INTO konyvek
        (mufaj_id, cim, kiadasi_ev, oldalszam, kolcsonozheto)
        VALUES (?, ?, ?, ?, ?)`,
        [mufaj_id, cim, kiadasi_ev, oldalszam, kolcsonozheto],
        (err, result) => {

            if (err) return res.status(500).json({ hiba: err });

            res.status(201).json({
                uzenet: 'Könyv hozzáadva',
                id: result.insertId
            });
        }
    );

});

app.post('/mufajok', (req, res) => {

    const { nev } = req.body;

    pool.query(
        'INSERT INTO mufajok (nev) VALUES (?)',
        [nev],
        (err, result) => {

            if (err) return res.status(500).json({ hiba: err });

            res.status(201).json({
                uzenet: 'Műfaj hozzáadva',
                id: result.insertId
            });
        }
    );

});

app.delete('/konyvek/:id', (req, res) => {

    pool.query(
        'DELETE FROM konyvek WHERE id = ?',
        [req.params.id],
        (err, result) => {

            if (err) return res.status(500).json({ hiba: err });

            res.status(200).json({
                uzenet: 'Könyv törölve',
                torolt: result.affectedRows
            });
        }
    );

});

app.delete('/mufajok/:id', (req, res) => {

    pool.query(
        'DELETE FROM mufajok WHERE id = ?',
        [req.params.id],
        (err, result) => {

            if (err) return res.status(500).json({ hiba: err });

            res.status(200).json({
                uzenet: 'Műfaj törölve',
                torolt: result.affectedRows
            });
        }
    );

});

app.put('/konyvek/:id', (req, res) => {

    const {
        mufaj_id,
        cim,
        kiadasi_ev,
        oldalszam,
        kolcsonozheto
    } = req.body;

    pool.query(
        `UPDATE konyvek
        SET mufaj_id = ?,
            cim = ?,
            kiadasi_ev = ?,
            oldalszam = ?,
            kolcsonozheto = ?
        WHERE id = ?`,
        [
            mufaj_id,
            cim,
            kiadasi_ev,
            oldalszam,
            kolcsonozheto,
            req.params.id
        ],
        (err, result) => {

            if (err) return res.status(500).json({ hiba: err });

            res.status(200).json({
                uzenet: 'Könyv módosítva'
            });
        }
    );

});

app.put('/konyvek/kolcsonozheto/:id', (req, res) => {

    const { kolcsonozheto } = req.body;

    pool.query(
        `UPDATE konyvek
         SET kolcsonozheto = ?
         WHERE id = ?`,
        [kolcsonozheto, req.params.id],
        (err, result) => {

            if (err) return res.status(500).json({ hiba: err });

            res.status(200).json({
                uzenet: 'Kölcsönözhetőség módosítva'
            });
        }
    );

});