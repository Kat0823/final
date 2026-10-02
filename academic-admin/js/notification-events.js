/* =========================================================
   SIKNAYAN - NOTIFICATION EVENTS
   ---------------------------------------------------------
   Central event writer for the frontend prototype.

   CURRENT:
       localStorage

   FUTURE:
       FastAPI -> PostgreSQL

   IMPORTANT:
       This records EVENTS.
       It does not calculate current dashboard states.
========================================================= */

(function () {

    "use strict";


    const STORAGE_KEY =
        "siknayan_academic_admin_notification_events";


    /* =====================================================
       HELPERS
    ===================================================== */

    function text(value) {

        return String(
            value ?? ""
        ).trim();

    }


    function readEvents() {

        try {

            const raw =
                localStorage.getItem(
                    STORAGE_KEY
                );

            if (!raw) {
                return [];
            }

            const parsed =
                JSON.parse(raw);

            return Array.isArray(parsed)
                ? parsed
                : [];

        } catch (error) {

            console.error(
                "Notification Events: unable to read event storage.",
                error
            );

            return [];

        }

    }


    function saveEvents(events) {

        try {

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(events)
            );

        } catch (error) {

            console.error(
                "Notification Events: unable to save event storage.",
                error
            );

        }

    }


    function createId() {

        return (
            "evt-" +
            Date.now() +
            "-" +
            Math.random()
                .toString(36)
                .slice(2, 8)
        );

    }



    /* =====================================================
       CREATE EVENT
    ===================================================== */

    function createNotificationEvent(
        event
    ) {

        if (
            !event ||
            typeof event !== "object"
        ) {

            return null;

        }


        const notification = {

            id:
                text(
                    event.id
                ) ||
                createId(),

            type:
                text(
                    event.type
                ) ||
                "system",

            category:
                text(
                    event.category
                ) ||
                "system",

            title:
                text(
                    event.title
                ) ||
                "Notification",

            message:
                text(
                    event.message
                ),

            actorId:
                text(
                    event.actorId
                ),

            actorName:
                text(
                    event.actorName
                ),

            recipientRole:
                text(
                    event.recipientRole
                ) ||
                "academic-admin",

            recipientId:
                text(
                    event.recipientId
                ),

            sourceType:
                text(
                    event.sourceType
                ),

            sourceId:
                text(
                    event.sourceId
                ),

            createdAt:
                event.createdAt ||
                new Date().toISOString(),

            priority:
                text(
                    event.priority
                ) ||
                "normal",

            icon:
                text(
                    event.icon
                ) ||
                "bell",

            actionLabel:
                text(
                    event.actionLabel
                ),

            actionHref:
                text(
                    event.actionHref
                ),

            metadata:
                event.metadata &&
                typeof event.metadata === "object"

                    ? event.metadata

                    : {}

        };


        const events =
            readEvents();


        /*
         * Prevent duplicate event IDs.
         */

        const duplicate =
            events.some(
                existing =>
                    existing.id ===
                    notification.id
            );


        if (
            duplicate
        ) {

            return notification;

        }


        events.push(
            notification
        );


        saveEvents(
            events
        );


        /*
         * Notify any currently open UI
         * that a new event exists.
         */

        window.dispatchEvent(
            new CustomEvent(
                "siknayan:notification-created",
                {
                    detail:
                        notification
                }
            )
        );


        return notification;

    }



    /* =====================================================
       GET EVENTS
    ===================================================== */

    function getNotificationEvents() {

        return readEvents();

    }



    /* =====================================================
       DELETE EVENT
    ===================================================== */

    function deleteNotificationEvent(
        eventId
    ) {

        const events =
            readEvents();


        const remaining =
            events.filter(
                event =>
                    event.id !==
                    eventId
            );


        saveEvents(
            remaining
        );

    }



    /* =====================================================
       PUBLIC API
    ===================================================== */

    window.SiknayanNotificationEvents = {

        create:
            createNotificationEvent,

        getAll:
            getNotificationEvents,

        delete:
            deleteNotificationEvent

    };


})();