const Discord = require('discord.js');
const fs = require("fs");

exports.get = (name) => {
    if (name == 'tags'){
        tags = ({
            "ПРА-ВО": "⋆ The Board of State ⋆",
            "ГЦЛ": "⋆ The Board of State ⋆",
            "АШ": "⋆ The Board of State ⋆",
            "ЦБ": "⋆ The Board of State ⋆",
        
            "FBI": "⋆ Department of Justice ⋆",
            "ФБР": "⋆ Department of Justice ⋆",
            "LSPD": "⋆ Department of Justice ⋆",
            "ЛСПД": "⋆ Department of Justice ⋆",
            "SFPD": "⋆ Department of Justice ⋆",
            "СФПД": "⋆ Department of Justice ⋆",
            "LVPD": "⋆ Department of Justice ⋆",
            "ЛВПД": "⋆ Department of Justice ⋆",
            "SWAT": "⋆ Department of Justice ⋆",
            "СВАТ": "⋆ Department of Justice ⋆",
            "RCPD": "⋆ Department of Justice ⋆",
            "РКПД": "⋆ Department of Justice ⋆",
            "RCSD": "⋆ Department of Justice ⋆",
        
            "LSA": "⋆ Department of Defence ⋆",
            "ЛСА": "⋆ Department of Defence ⋆",
            "SFA": "⋆ Department of Defence ⋆",
            "СФА": "⋆ Department of Defence ⋆",
            "LS-A": "⋆ Department of Defence ⋆",
            "ЛС-А": "⋆ Department of Defence ⋆",
            "SF-A": "⋆ Department of Defence ⋆",
            "СФ-А": "⋆ Department of Defence ⋆",
            "ТСР": "⋆ Department of Defence ⋆",
            "ТЮРЬМА": "⋆ Department of Defence ⋆",
        
            "LSMC": "⋆ Department of Health ⋆",
            "ЛСМЦ": "⋆ Department of Health ⋆",
            "SFMC": "⋆ Department of Health ⋆",
            "СФМЦ": "⋆ Department of Health ⋆",
            "LVMC": "⋆ Department of Health ⋆",
            "ЛВМЦ": "⋆ Department of Health ⋆",
        
            "R-LS": "⋆ Mass Media ⋆",
            "RLS": "⋆ Mass Media ⋆",
            "Р-ЛС": "⋆ Mass Media ⋆",
            "РЛС": "⋆ Mass Media ⋆",
            "R-SF": "⋆ Mass Media ⋆",
            "RSF": "⋆ Mass Media ⋆",
            "Р-СФ": "⋆ Mass Media ⋆",
            "РСФ": "⋆ Mass Media ⋆",
            "R-LV": "⋆ Mass Media ⋆",
            "RLV": "⋆ Mass Media ⋆",
            "Р-ЛВ": "⋆ Mass Media ⋆",
            "РЛВ": "⋆ Mass Media ⋆",
            "CNN LS": "⋆ Mass Media ⋆",
            "CNN LV": "⋆ Mass Media ⋆",
            "CNN SF": "⋆ Mass Media ⋆",
        
            "WMC": "⋆ Warlock MC ⋆",
            "W-MC": "⋆ Warlock MC ⋆",
            "RM": "⋆ Russian Mafia ⋆",
            "РМ": "⋆ Russian Mafia ⋆",
            "LCN": "⋆ La Cosa Nostra ⋆",
            "ЛКН": "⋆ La Cosa Nostra ⋆",
            "YAKUZA": "⋆ Yakuza ⋆",
            "ЯКУДЗА": "⋆ Yakuza ⋆",
        
            "GROVE": "⋆ Grove Street Gang ⋆",
            "ГРУВ": "⋆ Grove Street Gang ⋆",
            "BALLAS": "⋆ East Side Ballas Gang ⋆",
            "БАЛЛАС": "⋆ East Side Ballas Gang ⋆",
            "VAGOS": "⋆ Vagos Gang ⋆",
            "ВАГОС": "⋆ Vagos Gang ⋆",
            "NW": "⋆ Night Wolfs ⋆",
            "НВ": "⋆ Night Wolfs ⋆",
            "RIFA": "⋆ Rifa Gang ⋆",
            "РИФА": "⋆ Rifa Gang ⋆",
            "AZTEC": "⋆ Aztecas Gang ⋆",  
            "АЦТЕК": "⋆ Aztecas Gang ⋆",  
        });
        return tags;
    }else if (name == 'manytags'){
        let manytags = [
            "ПРА-ВО",
            "ГЦЛ",
            "АШ",
            "ЦБ",
            
            "FBI",
            "ФБР",
            "LSPD",
            "ЛСПД",
            "SFPD",
            "СФПД",
            "LVPD",
            "ЛВПД",
            "SWAT",
            "СВАТ",
            "RCPD",
            "РКПД",
            "RCSD",
            
            "LSA",
            "ЛСА",
            "SFA",
            "СФА",
            "LS-A",
            "ЛС-А",
            "SF-A",
            "СФ-А",
            "ТСР",
            "ТЮРЬМА",
            
            "LSMC",
            "ЛСМЦ",
            "SFMC",
            "СФМЦ",
            "LVMC",
            "ЛВМЦ",
            
            "R-LS",
            "RLS",
            "Р-ЛС",
            "РЛС",
            "R-SF",
            "RSF",
            "Р-СФ",
            "РСФ",
            "R-LV",
            "RLV",
            "Р-ЛВ",
            "РЛВ",
            "CNN LS",
            "CNN LV",
            "CNN SF",
            
            "WMC",
            "W-MC",
            "RM",
            "РМ",
            "LCN",
            "ЛКН",
            "YAKUZA",
            "ЯКУДЗА",
            
            "GROVE",
            "ГРУВ",
            "BALLAS",
            "БАЛЛАС",
            "VAGOS",
            "ВАГОС",
            "AZTEC",  
            "АЦТЕК",
            "RIFA",
            "РИФА",
            "NW",
            "НВ",
        ];
        return manytags;
    }else if (name == 'rolesgg'){
        let rolesgg = ["⋆ The Board of State ⋆", "⋆ Department of Justice ⋆", "⋆ Department of Defence ⋆", "⋆ Department of Health ⋆", "⋆ Mass Media ⋆", "⋆ Warlock MC ⋆", "⋆ Russian Mafia ⋆", "⋆ La Cosa Nostra ⋆", "⋆ Yakuza ⋆", "⋆ Grove Street Gang ⋆", "⋆ East Side Ballas Gang ⋆", "⋆ Vagos Gang ⋆", "⋆ Aztecas Gang ⋆", "⋆ Rifa Gang ⋆", "⋆ Night Wolfs ⋆"]
        return rolesgg;
    }else if (name == 'canremoverole'){
        let canremoverole = ["✫Deputy Leader✫", "✵Leader✵", "✮Ministers✮", "✔ Helper ✔"];
        return canremoverole;
    }else{
        return null;
    }
}
