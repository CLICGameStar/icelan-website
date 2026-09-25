import localFont from "next/font/local";

const quicksand = localFont({
    src: "../../public/fonts/Quicksand-Light.woff",
});

export default function Reglement() {
    return (
        <div className="flex flex-col items-center flex-1 font-sans bg-black items-center">
            <div className="flex flex-col w-4/5 max-w-2xl">
                <h2 className="self-center mb-4">Règlement ICeLAN</h2>
                <h3>Résumé</h3>
                <ul className={`${quicksand.className} font-bold text-justify mb-10 list-disc`}>
                    <li>Sois respectueux·euse des gens, du matériel et des lieux.</li>
                    <li>
                        S&apos;il y a un problème, on se réserve le droit de te virer de l&apos;événement si nécessaire,
                        sans remboursement.
                    </li>
                </ul>

                <h3>Préambule</h3>
                <ul className={`${quicksand.className} font-bold text-justify mb-10 list-disc`}>
                    <li>Ce règlement s&apos;applique à toute personne participant ou organisant ICeLAN.</li>
                    <li>
                        L&apos;organisation se réserve le droit d&apos;expulser sans remboursement ou compensation
                        financière toute personne ne respectant pas le présent règlement, perturbant l&apos;événement,
                        ou sous couvert de toute autre raison à la discrétion de l&apos;organisation.
                    </li>
                    <li>
                        En cas de non-respect de la demande de quitter l&apos;événement, les forces de sécurité de
                        l&apos;EPFL pourront être contactées.
                    </li>
                    <li>
                        Tous frais inhérents au non-respect du présent règlement seront facturés directement au
                        contrevenant ou à la contrevenante.
                    </li>
                </ul>

                <h3>Lois en vigueur</h3>
                <ul className={`${quicksand.className} font-bold text-justify mb-10 list-disc`}>
                    <li>Les règles de l&apos;EPFL.</li>
                    <li>Les lois en vigueur dans le canton de Vaud et en Suisse.</li>
                </ul>

                <h3>Inscriptions</h3>
                <ul className={`${quicksand.className} font-bold text-justify mb-10 list-disc`}>
                    <li>
                        L&apos;inscription est à payer avant l&apos;événement. En cas de défaut de paiement,
                        l&apos;organisation se réserve le droit de refuser l&apos;inscription.
                    </li>
                    <li>
                        Toute annulation doit être adressée par courriel à l&apos;organisation au plus tard le Vendredi
                        avant le weekend de l&apos;événement. Le remboursement de l&apos;inscription ne sera pas
                        possible passé ce délai.
                    </li>
                    <li>
                        Le paiement de toute inscription, même en cas d&apos;absence, reste dû, sauf en cas
                        d&apos;annulation adressée par courriel.
                    </li>
                    <li>
                        L&apos;organisation ne paye pas l&apos;inscription, et peut profiter de l&apos;intégralité de
                        l&apos;événement, sauf des tournois. La priorité est cependant donnée aux participant·e·s. Des
                        exceptions seront réalisées s&apos;il manque des gens pour compléter une équipe lors d&apos;un
                        tournoi.
                    </li>
                    <li>
                        Les visiteur·e·s ne payent pas l&apos;inscription, et peuvent profiter des animations. La
                        priorité est cependant donnée aux participant·e·s.
                    </li>
                </ul>

                <h3>Comportement sur place</h3>
                <ul className={`${quicksand.className} font-bold text-justify mb-10 list-disc`}>
                    <li>
                        De manière générale, il est attendu des participant·e·s un comportement décent. Cela implique de
                        porter une tenue habillée (pas en maillot de bain, pas en sous-vêtements, torse nu, ...), de
                        respecter les autres participant·e·s, de respecter les staffs, de respecter le matériel, et de
                        respecter les lieux.
                    </li>
                    <li>
                        Tout comportement indécent, notamment insultes, racisme, homophobie, transphobie, diffamation,
                        ou tout autre comportement interdit par la loi ou autant strictement négatif, est interdit.
                    </li>
                    <li>
                        Il est strictement interdit de manger ou de boire en dehors du Hall principal et de la Zone
                        Chill. Particulièrement, il est strictement interdit de manger ou de boire près des équipements
                        et du matériel de l&apos;événement.
                    </li>
                    <li>
                        Il est strictement interdit de fumer ou de vapoter à l&apos;intérieur des bâtiments.
                        Particulièrement, la consommation de drogues est interdite au sein de l&apos;événement.
                    </li>
                    <li>
                        Toute personne jugée inapte à participer à l&apos;événement dû à une intoxication (alcool,
                        drogue, ...) sera invitée à quitter les lieux.
                    </li>
                    <li>
                        Nous vous invitons à jeter vos déchets dans les nombreuses poubelles disponibles sur place, et à
                        ne pas les laisser traîner partout.
                    </li>
                    <li>
                        Toute forme de promotion non autorisée par l&apos;organisation est strictement interdite. Venez
                        nous demander avant.
                    </li>
                    <li>
                        Les mineur·e·s de moins de seize ans ne sont pas autorisé·e·s à participer à l&apos;événement,
                        ceux·celles de plus de seize ans sont autorisé·e·s à l&apos;événement sur autorisation parentale
                        écrite et envoyée à l&apos;organisation avant le week-end de l&apos;événement.
                    </li>
                    <li>Merci de correctement indiquer vos allergies dans le formulaire.</li>
                    <li>La tricherie est interdite sous toute forme qu&apos;il soit.</li>
                </ul>

                <h3>Matériel et réseau</h3>
                <ul className={`${quicksand.className} font-bold text-justify mb-10 list-disc`}>
                    <li>
                        Nous invitons les participant·e·s à venir à l&apos;événement avec leur propre matériel, par
                        exemple :
                        <ul className="pl-8 list-disc">
                            <li>
                                Ordinateur personnel complet (laptop ou tour, écran, clavier, souris + tous les câbles)
                            </li>
                            <li>Câble Ethernet</li>
                            <li>Casque audio</li>
                        </ul>
                    </li>
                    <li>
                        La totalité de votre matériel devra pouvoir tenir à l&apos;intérieur de l&apos;espace attribué
                        par place. Il n&apos;est pas autorisé de dépasser de son espace attribué, sauf arrangement à
                        l&apos;amiable avec vos voisin·e·s.
                    </li>
                    <li>
                        L&apos;utilisation d&apos;enceintes est interdite ; les participant·e·s sont invité·e·s à
                        utiliser un casque ou des écouteurs.
                    </li>
                    <li>
                        Il est interdit de ramener son propre mobilier à l&apos;événement (e.g., chaise, table). Il est
                        possible de demander des exceptions par courriel auprès de l&apos;organisation, au plus tard le
                        Vendredi avant le weekend de l&apos;événement.
                    </li>
                    <li>
                        Le matériel apporté par vos soins reste sous votre responsabilité tout le long de
                        l&apos;événement.
                    </li>
                    <li>
                        Tout matériel électrique, qui n&apos;est pas nécessaire pour jouer, non validé par
                        l&apos;organisation, est interdit, à l&apos;exception des chargeurs pour téléphone portable. Il
                        est possible de demander des exceptions auprès de l&apos;organisation.{" "}
                    </li>
                    <li>
                        En cas d&apos;abus d&apos;utilisation du réseau, l&apos;organisation se réserve le droit
                        d&apos;en couper l&apos;accès. Cela implique notamment : téléchargements lourds, illégaux, ou
                        spam, utilisation du réseau à des fins illégales, abus. Les règles de l&apos;EPFL et les lois
                        s&apos;appliquent.
                    </li>
                    <li>Toute manipulation sur le réseau électrique ou informatique est strictement interdite.</li>
                    <li>
                        Les participant·e·s se doivent de posséder les droits et licences des logiciels, des jeux, et de
                        tout matériel utilisé par leurs soins.
                    </li>
                </ul>

                <h3>Divers</h3>
                <ul className={`${quicksand.className} font-bold text-justify mb-10 list-disc`}>
                    <li>
                        L&apos;organisation se réserve le droit d&apos;annuler l&apos;événement pour toute raison jugée
                        nécessaire (e.g., décision de l&apos;école, problème légal, tremblement de terre, ...). Aucun
                        remboursement ne sera accordé le cas échéant.
                    </li>
                    <li>Tout matériel en verre est strictement interdit au sein de l&apos;événement.</li>
                    <li>Les animaux sont interdits au sein des salles.</li>
                    <li>
                        Les potentiels prix doivent être récupérés au moment de leur distribution. En cas d&apos;absence
                        d&apos;un·e gagnant·e lors de la distribution, les potentiels prix seront redistribués à
                        d&apos;autres personnes.
                    </li>
                    <li>Les visiteur·e·s ne sont pas autorisé·e·s sur le site entre 22h et 7h.</li>
                </ul>

                <h3>Non-responsabilité</h3>
                <ul className={`${quicksand.className} font-bold text-justify mb-10 list-disc`}>
                    <li>
                        L&apos;organisation décline toute responsabilité en cas de vol ou de dommage de matériel ou de
                        personne. Toute dégradation du matériel appartenant à l&apos;événement sera facturée auprès des
                        personnes responsables.
                    </li>
                    <li>
                        De plus, l&apos;organisation ne pourra être tenue responsable du comportement des
                        participant·e·s en dehors de l&apos;événement.
                    </li>
                </ul>

                <h3>Droit à l&apos;image</h3>
                <p className={`${quicksand.className} font-bold text-justify mb-10 text-justify !max-w-2xl !text-base`}>
                    Dans le cadre des activités de Game*, les participant·e·s pourront être photographié·e·s, filmé·e·s,
                    ou faire l&apos;objet d&apos;un enregistrement audio ou d&apos;une captation numérique. Ces médias
                    seront utilisés principalement à des fins promotionnelles.
                    <br />
                    <br />
                    Par ma présence à l&apos;événement, j&apos;autorise Game*, les services de l&apos;EPFL, et toute
                    autre entité concernée par l&apos;événement à utiliser, reproduire et diffuser à titre gratuit mon
                    image et ma prestation - vidéo, photo, enregistrement audio et/ou captation numérique - enregistrées
                    lors de l&apos;événement, peu importe le support. Les images pourront être exploitées, utilisées et
                    diffusées directement par Game* sous toute forme et tous supports connus et inconnus à ce jour, pour
                    un territoire illimité, sans limitation de durée, intégralement ou par extraits et notamment :
                    presse, livre, supports d&apos;enregistrement numérique, exposition, publicité, projection publique,
                    concours, site internet, réseaux sociaux.
                    <br />
                    <br />
                    Mon image et voix ne pourront pas être utilisées par des membres de Game* ou de l&apos;EPFL à titre
                    personnel pour des activités non associatives ou non académiques. Game* s&apos;interdit expressément
                    de procéder à une exploitation des photographies susceptible de porter atteinte à la vie privée ou à
                    la réputation, et d&apos;utiliser les photographies, vidéos, enregistrements audio ou captations
                    numériques de la présente, dans tout support ou toute exploitation préjudiciable.
                    <br />
                    <br />
                    Par ma présence à l&apos;événement, je me reconnais être entièrement rempli·e de mes droits et je ne
                    pourrai prétendre à aucune rémunération pour l&apos;exploitation des droits vis à vis des présentes.
                    Je garantis que je ne suis pas lié·e par un contrat exclusif relatif à l&apos;utilisation de mon
                    image ou de mon nom. Pour tout litige né de l&apos;interprétation ou de l&apos;exécution des
                    présentes, il est fait attribution expresse de juridiction aux tribunaux du canton de Vaud.
                </p>
            </div>
        </div>
    );
}
